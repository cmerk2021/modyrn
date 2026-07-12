import { Injectable, Logger } from '@nestjs/common';
import { automodEvents, eq, guilds, type AutomodRuleRow, type Database } from '@modyrn/database';
import {
  ActionOrigin,
  AutomodActionType,
  AutomodConditionField,
  AutomodEventType,
  AutomodLogic,
  AutomodOperator,
  type AutomodAction,
  type AutomodConditionGroup,
  type AutomodConditionNode,
} from '@modyrn/shared';
import { InjectDatabase } from '../database/inject-database.decorator.js';
import { DiscordRestService } from '../discord/discord-rest.service.js';
import { ModerationService } from '../moderation/moderation.service.js';
import { ulid } from '../common/id.util.js';

/** Normalized evaluation context derived from a gateway event. */
export interface AutomodContext {
  event: AutomodEventType;
  guildId: string;
  channelId?: string;
  messageId?: string;
  authorId: string;
  authorRoleIds: string[];
  authorIsBot: boolean;
  authorHasAvatar: boolean;
  accountAgeDays: number;
  joinAgeDays: number;
  content: string;
  mentionCount: number;
  attachmentCount: number;
  username: string;
  nickname: string | null;
}

const INVITE_REGEX = /(discord\.gg|discord(?:app)?\.com\/invite)\//i;
const LINK_REGEX = /https?:\/\//gi;
const EMOJI_REGEX = /<a?:\w+:\d+>|\p{Extended_Pictographic}/gu;

/** Evaluates automod rules against events and executes their actions. */
@Injectable()
export class AutomodEngineService {
  private readonly logger = new Logger(AutomodEngineService.name);

  constructor(
    @InjectDatabase() private readonly db: Database,
    private readonly rest: DiscordRestService,
    private readonly moderation: ModerationService,
  ) {}

  /** Resolves a field value from the context for comparison. */
  private resolveField(field: AutomodConditionField, ctx: AutomodContext): unknown {
    switch (field) {
      case AutomodConditionField.MessageContent:
        return ctx.content;
      case AutomodConditionField.MessageMentionCount:
        return ctx.mentionCount;
      case AutomodConditionField.MessageAttachmentCount:
        return ctx.attachmentCount;
      case AutomodConditionField.MessageLinkCount:
        return (ctx.content.match(LINK_REGEX) ?? []).length;
      case AutomodConditionField.MessageCapsRatio:
        return this.capsRatio(ctx.content);
      case AutomodConditionField.MessageEmojiCount:
        return (ctx.content.match(EMOJI_REGEX) ?? []).length;
      case AutomodConditionField.MessageContainsInvite:
        return INVITE_REGEX.test(ctx.content);
      case AutomodConditionField.ChannelId:
        return ctx.channelId;
      case AutomodConditionField.AuthorAccountAgeDays:
        return ctx.accountAgeDays;
      case AutomodConditionField.AuthorJoinAgeDays:
        return ctx.joinAgeDays;
      case AutomodConditionField.AuthorRoleIds:
        return ctx.authorRoleIds;
      case AutomodConditionField.AuthorIsBot:
        return ctx.authorIsBot;
      case AutomodConditionField.AuthorHasAvatar:
        return ctx.authorHasAvatar;
      case AutomodConditionField.MemberUsername:
        return ctx.username;
      case AutomodConditionField.MemberNickname:
        return ctx.nickname ?? '';
      default:
        return undefined;
    }
  }

  private compare(
    actual: unknown,
    operator: AutomodOperator,
    expected: unknown,
    ci?: boolean,
  ): boolean {
    const norm = (v: unknown) => (ci && typeof v === 'string' ? v.toLowerCase() : v);
    const a = norm(actual);
    const b = norm(expected);
    switch (operator) {
      case AutomodOperator.Equals:
        return a === b;
      case AutomodOperator.NotEquals:
        return a !== b;
      case AutomodOperator.GreaterThan:
        return Number(a) > Number(b);
      case AutomodOperator.GreaterThanOrEqual:
        return Number(a) >= Number(b);
      case AutomodOperator.LessThan:
        return Number(a) < Number(b);
      case AutomodOperator.LessThanOrEqual:
        return Number(a) <= Number(b);
      case AutomodOperator.Contains:
        return String(a).includes(String(b));
      case AutomodOperator.NotContains:
        return !String(a).includes(String(b));
      case AutomodOperator.StartsWith:
        return String(a).startsWith(String(b));
      case AutomodOperator.EndsWith:
        return String(a).endsWith(String(b));
      case AutomodOperator.MatchesRegex:
        try {
          return new RegExp(String(expected), ci ? 'i' : '').test(String(actual));
        } catch {
          return false;
        }
      case AutomodOperator.In:
        return Array.isArray(b) ? b.includes(a) : Array.isArray(a) && a.includes(b);
      case AutomodOperator.NotIn:
        return Array.isArray(b) ? !b.includes(a) : true;
      case AutomodOperator.IsTrue:
        return actual === true;
      case AutomodOperator.IsFalse:
        return actual === false;
      default:
        return false;
    }
  }

  private evaluateNode(node: AutomodConditionNode, ctx: AutomodContext): boolean {
    if (node.kind === 'condition') {
      const actual = this.resolveField(node.field, ctx);
      return this.compare(actual, node.operator, node.value, node.caseInsensitive);
    }
    return this.evaluateGroup(node, ctx);
  }

  private evaluateGroup(group: AutomodConditionGroup, ctx: AutomodContext): boolean {
    if (group.children.length === 0) return true; // empty AND matches everything
    const results = group.children.map((c) => this.evaluateNode(c, ctx));
    switch (group.logic) {
      case AutomodLogic.And:
        return results.every(Boolean);
      case AutomodLogic.Or:
        return results.some(Boolean);
      case AutomodLogic.Not:
        return !results.some(Boolean);
      default:
        return false;
    }
  }

  /** Dry-run a rule against a context (for the simulator). */
  simulate(rule: AutomodRuleRow, ctx: AutomodContext): boolean {
    if (ctx.event !== rule.event) return false;
    if (rule.exemptRoleIds.some((r) => ctx.authorRoleIds.includes(r))) return false;
    if (ctx.channelId && rule.exemptChannelIds.includes(ctx.channelId)) return false;
    return this.evaluateGroup(rule.conditions, ctx);
  }

  /** Evaluates all enabled rules for the event and runs actions on matches. */
  async run(ctx: AutomodContext, rules: AutomodRuleRow[]): Promise<void> {
    const applicable = rules
      .filter((r) => r.enabled && r.event === ctx.event)
      .sort((a, b) => b.priority - a.priority);

    for (const rule of applicable) {
      if (!this.simulate(rule, ctx)) continue;
      try {
        await this.applyActions(rule, ctx);
      } catch (error) {
        this.logger.warn(`Automod rule ${rule.id} failed: ${String(error)}`);
      }
      if (rule.stopProcessing) break;
    }
  }

  private async applyActions(rule: AutomodRuleRow, ctx: AutomodContext): Promise<void> {
    const base = {
      guildId: ctx.guildId,
      moderatorId: 'automod',
      targetUserId: ctx.authorId,
      origin: ActionOrigin.Automod,
      dmUser: false as const,
    };

    for (const action of rule.actions) {
      const params = action.params ?? {};
      const reason = (params.reason as string) ?? `Automod: ${rule.name}`;
      switch (action.type) {
        case AutomodActionType.DeleteMessage:
          if (ctx.channelId && ctx.messageId) {
            await this.rest.deleteMessage(ctx.channelId, ctx.messageId, reason).catch(() => null);
          }
          break;
        case AutomodActionType.Warn:
          await this.moderation.warn({ ...base, reason });
          break;
        case AutomodActionType.Timeout:
          await this.moderation.timeout({
            ...base,
            reason,
            durationMs: Number(params.durationMs ?? 600_000),
          });
          break;
        case AutomodActionType.Kick:
          await this.moderation.kick({ ...base, reason });
          break;
        case AutomodActionType.Ban:
          await this.moderation.ban({ ...base, reason });
          break;
        case AutomodActionType.Quarantine:
          await this.moderation.quarantine({ ...base, reason }).catch(() => null);
          break;
        case AutomodActionType.AddRole:
          if (params.roleId)
            await this.rest.addRole(ctx.guildId, ctx.authorId, String(params.roleId), reason);
          break;
        case AutomodActionType.RemoveRole:
          if (params.roleId)
            await this.rest.removeRole(ctx.guildId, ctx.authorId, String(params.roleId), reason);
          break;
        case AutomodActionType.SendMessage:
          if (ctx.channelId && params.message)
            await this.rest.sendMessage(ctx.channelId, { content: String(params.message) });
          break;
        case AutomodActionType.DmUser:
          if (params.message)
            await this.rest.sendDirectMessage(ctx.authorId, { content: String(params.message) });
          break;
        case AutomodActionType.NotifyModerators:
        case AutomodActionType.Log:
          await this.notifyModLog(ctx, rule);
          break;
        default:
          break;
      }
    }

    await this.db.insert(automodEvents).values({
      id: ulid(),
      guildId: ctx.guildId,
      ruleId: rule.id,
      userId: ctx.authorId,
      channelId: ctx.channelId,
      actionsTaken: rule.actions as AutomodAction[],
      contentSnapshot: ctx.content.slice(0, 500),
    });
  }

  private async notifyModLog(ctx: AutomodContext, rule: AutomodRuleRow): Promise<void> {
    const [guild] = await this.db.select().from(guilds).where(eq(guilds.id, ctx.guildId)).limit(1);
    const channelId = guild?.settings.modLogChannelId;
    if (!channelId) return;
    await this.rest
      .sendMessage(channelId, {
        embeds: [
          {
            title: `Automod · ${rule.name}`,
            color: 0xfaa61a,
            fields: [
              { name: 'User', value: `<@${ctx.authorId}>`, inline: true },
              { name: 'Channel', value: ctx.channelId ? `<#${ctx.channelId}>` : '—', inline: true },
              { name: 'Content', value: ctx.content.slice(0, 1000) || '—' },
            ],
          },
        ],
      })
      .catch(() => null);
  }

  private capsRatio(content: string): number {
    const letters = content.replace(/[^a-zA-Z]/g, '');
    if (letters.length < 8) return 0;
    const upper = letters.replace(/[^A-Z]/g, '').length;
    return upper / letters.length;
  }
}
