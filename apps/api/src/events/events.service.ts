import { Injectable, Logger } from '@nestjs/common';
import { LogEventType } from '@modyrn/shared';
import { AutomodEventType } from '@modyrn/shared';
import { AutomodService } from '../automod/automod.service.js';
import { AutomodEngineService, type AutomodContext } from '../automod/automod-engine.service.js';
import { LoggingService } from '../logging/logging.service.js';
import { UtilityService } from '../utility/utility.service.js';

const DISCORD_EPOCH = 1420070400000n;

interface Author {
  id: string;
  username?: string;
  bot?: boolean;
  avatar?: string | null;
}

/** A normalized gateway event forwarded by the bot. */
export interface GatewayEvent {
  event: string;
  payload: Record<string, unknown>;
}

/**
 * Central dispatcher for gateway events the bot forwards. Routes them to the
 * automod engine and the logging subsystem.
 */
@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    private readonly automod: AutomodService,
    private readonly engine: AutomodEngineService,
    private readonly logging: LoggingService,
    private readonly utility: UtilityService,
  ) {}

  async handle({ event, payload }: GatewayEvent): Promise<void> {
    try {
      switch (event) {
        case 'message_create':
          await this.onMessage(payload, AutomodEventType.MessageCreate);
          break;
        case 'message_update':
          await this.onMessage(payload, AutomodEventType.MessageUpdate);
          await this.logMessageEdit(payload);
          break;
        case 'message_delete':
          await this.logMessageDelete(payload);
          break;
        case 'member_join':
          await this.onMemberJoin(payload);
          break;
        case 'member_leave':
          await this.logging.dispatch(String(payload.guildId), LogEventType.MemberLeave, {
            title: 'Member left',
            color: 0xf04747,
            description: `<@${String(payload.userId)}> left the server.`,
          });
          break;
        default:
          break;
      }
    } catch (error) {
      this.logger.warn(`Event ${event} failed: ${String(error)}`);
    }
  }

  private accountAgeDays(userId: string): number {
    try {
      const created = Number((BigInt(userId) >> 22n) + DISCORD_EPOCH);
      return Math.floor((Date.now() - created) / 86_400_000);
    } catch {
      return 9999;
    }
  }

  private async onMessage(
    payload: Record<string, unknown>,
    event: AutomodEventType,
  ): Promise<void> {
    const author = payload.author as Author | undefined;
    if (!author || author.bot) return;
    const guildId = String(payload.guildId);
    const member = (payload.member as { roles?: string[]; joinedAt?: string }) ?? {};

    const ctx: AutomodContext = {
      event,
      guildId,
      channelId: payload.channelId ? String(payload.channelId) : undefined,
      messageId: payload.messageId ? String(payload.messageId) : undefined,
      authorId: author.id,
      authorRoleIds: member.roles ?? [],
      authorIsBot: Boolean(author.bot),
      authorHasAvatar: Boolean(author.avatar),
      accountAgeDays: this.accountAgeDays(author.id),
      joinAgeDays: member.joinedAt
        ? Math.floor((Date.now() - new Date(member.joinedAt).getTime()) / 86_400_000)
        : 0,
      content: String(payload.content ?? ''),
      mentionCount: Number(payload.mentionCount ?? 0),
      attachmentCount: Number(payload.attachmentCount ?? 0),
      username: author.username ?? '',
      nickname: (payload.nickname as string | null) ?? null,
    };

    const rules = await this.automod.list(guildId);
    if (rules.length > 0) await this.engine.run(ctx, rules);
  }

  private async onMemberJoin(payload: Record<string, unknown>): Promise<void> {
    const guildId = String(payload.guildId);
    const userId = String(payload.userId);

    // Welcome message + auto-roles.
    await this.utility.onMemberJoin(guildId, userId);

    await this.logging.dispatch(guildId, LogEventType.MemberJoin, {
      title: 'Member joined',
      color: 0x43b581,
      description: `<@${userId}> joined the server.`,
      fields: [
        {
          name: 'Account age',
          value: `${this.accountAgeDays(userId)} days`,
          inline: true,
        },
      ],
    });

    const ctx: AutomodContext = {
      event: AutomodEventType.MemberJoin,
      guildId,
      authorId: userId,
      authorRoleIds: [],
      authorIsBot: false,
      authorHasAvatar: Boolean(payload.hasAvatar),
      accountAgeDays: this.accountAgeDays(userId),
      joinAgeDays: 0,
      content: '',
      mentionCount: 0,
      attachmentCount: 0,
      username: String(payload.username ?? ''),
      nickname: null,
    };
    const rules = await this.automod.list(guildId);
    if (rules.length > 0) await this.engine.run(ctx, rules);
  }

  private async logMessageDelete(payload: Record<string, unknown>): Promise<void> {
    await this.logging.dispatch(String(payload.guildId), LogEventType.MessageDelete, {
      title: 'Message deleted',
      color: 0xf04747,
      description: payload.content ? String(payload.content).slice(0, 1000) : '*No cached content*',
      fields: [
        { name: 'Author', value: `<@${String(payload.authorId)}>`, inline: true },
        { name: 'Channel', value: `<#${String(payload.channelId)}>`, inline: true },
      ],
    });
  }

  private async logMessageEdit(payload: Record<string, unknown>): Promise<void> {
    await this.logging.dispatch(String(payload.guildId), LogEventType.MessageEdit, {
      title: 'Message edited',
      color: 0xfaa61a,
      fields: [
        { name: 'Author', value: `<@${String(payload.authorId)}>`, inline: true },
        { name: 'Channel', value: `<#${String(payload.channelId)}>`, inline: true },
        { name: 'Before', value: String(payload.before ?? '—').slice(0, 500) },
        { name: 'After', value: String(payload.content ?? '—').slice(0, 500) },
      ],
    });
  }
}
