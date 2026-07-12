import { Injectable, NotFoundException } from '@nestjs/common';
import {
  and,
  automodEvents,
  automodRules,
  desc,
  eq,
  type AutomodRuleRow,
  type Database,
  type NewAutomodRuleRow,
} from '@modyrn/database';
import {
  AutomodActionType,
  AutomodConditionField,
  AutomodEventType,
  AutomodLogic,
  AutomodOperator,
  emptyConditionGroup,
  type AutomodAction,
  type AutomodConditionGroup,
} from '@modyrn/shared';
import { InjectDatabase } from '../database/inject-database.decorator.js';
import { ulid } from '../common/id.util.js';

export interface UpsertRuleInput {
  name: string;
  description?: string;
  enabled?: boolean;
  priority?: number;
  event: AutomodEventType;
  conditions: AutomodConditionGroup;
  actions: AutomodAction[];
  stopProcessing?: boolean;
  exemptRoleIds?: string[];
  exemptChannelIds?: string[];
}

/** Named presets that create ready-made rules for common protections. */
export const AUTOMOD_PRESETS = {
  invite_links: {
    label: 'Block invite links',
    description: 'Deletes messages containing Discord invite links and warns the author.',
    build: (): UpsertRuleInput => ({
      name: 'Block invite links',
      event: AutomodEventType.MessageCreate,
      conditions: {
        kind: 'group',
        logic: AutomodLogic.And,
        children: [
          {
            kind: 'condition',
            field: AutomodConditionField.MessageContainsInvite,
            operator: AutomodOperator.IsTrue,
          },
        ],
      },
      actions: [
        { type: AutomodActionType.DeleteMessage },
        { type: AutomodActionType.Warn, params: { reason: 'Posting invite links' } },
      ],
    }),
  },
  mass_mentions: {
    label: 'Block mass mentions',
    description: 'Deletes messages that mention many users at once.',
    build: (): UpsertRuleInput => ({
      name: 'Block mass mentions',
      event: AutomodEventType.MessageCreate,
      conditions: {
        kind: 'group',
        logic: AutomodLogic.And,
        children: [
          {
            kind: 'condition',
            field: AutomodConditionField.MessageMentionCount,
            operator: AutomodOperator.GreaterThanOrEqual,
            value: 5,
          },
        ],
      },
      actions: [
        { type: AutomodActionType.DeleteMessage },
        { type: AutomodActionType.Timeout, params: { durationMs: 600_000 } },
      ],
    }),
  },
  caps_spam: {
    label: 'Block excessive caps',
    description: 'Deletes messages that are mostly uppercase.',
    build: (): UpsertRuleInput => ({
      name: 'Block excessive caps',
      event: AutomodEventType.MessageCreate,
      conditions: {
        kind: 'group',
        logic: AutomodLogic.And,
        children: [
          {
            kind: 'condition',
            field: AutomodConditionField.MessageCapsRatio,
            operator: AutomodOperator.GreaterThanOrEqual,
            value: 0.7,
          },
        ],
      },
      actions: [{ type: AutomodActionType.DeleteMessage }],
    }),
  },
  new_account_screening: {
    label: 'Screen new accounts',
    description: 'Warns moderators when very new accounts join.',
    build: (): UpsertRuleInput => ({
      name: 'Screen new accounts',
      event: AutomodEventType.MemberJoin,
      conditions: {
        kind: 'group',
        logic: AutomodLogic.And,
        children: [
          {
            kind: 'condition',
            field: AutomodConditionField.AuthorAccountAgeDays,
            operator: AutomodOperator.LessThan,
            value: 7,
          },
        ],
      },
      actions: [{ type: AutomodActionType.NotifyModerators }],
    }),
  },
} as const;

export type AutomodPresetKey = keyof typeof AUTOMOD_PRESETS;

/** CRUD for automod rules plus preset instantiation and event history. */
@Injectable()
export class AutomodService {
  constructor(@InjectDatabase() private readonly db: Database) {}

  list(guildId: string): Promise<AutomodRuleRow[]> {
    return this.db
      .select()
      .from(automodRules)
      .where(eq(automodRules.guildId, guildId))
      .orderBy(desc(automodRules.priority));
  }

  async get(guildId: string, ruleId: string): Promise<AutomodRuleRow> {
    const [rule] = await this.db
      .select()
      .from(automodRules)
      .where(and(eq(automodRules.guildId, guildId), eq(automodRules.id, ruleId)))
      .limit(1);
    if (!rule) throw new NotFoundException('Rule not found.');
    return rule;
  }

  create(guildId: string, input: UpsertRuleInput): Promise<AutomodRuleRow[]> {
    const values: NewAutomodRuleRow = {
      id: ulid(),
      guildId,
      name: input.name,
      description: input.description,
      enabled: input.enabled ?? true,
      priority: input.priority ?? 0,
      event: input.event,
      conditions: input.conditions ?? emptyConditionGroup(),
      actions: input.actions ?? [],
      stopProcessing: input.stopProcessing ?? false,
      exemptRoleIds: input.exemptRoleIds ?? [],
      exemptChannelIds: input.exemptChannelIds ?? [],
    };
    return this.db.insert(automodRules).values(values).returning();
  }

  async update(
    guildId: string,
    ruleId: string,
    input: Partial<UpsertRuleInput>,
  ): Promise<AutomodRuleRow> {
    await this.get(guildId, ruleId);
    const [updated] = await this.db
      .update(automodRules)
      .set({ ...input, updatedAt: new Date() })
      .where(and(eq(automodRules.guildId, guildId), eq(automodRules.id, ruleId)))
      .returning();
    return updated!;
  }

  async remove(guildId: string, ruleId: string): Promise<void> {
    await this.db
      .delete(automodRules)
      .where(and(eq(automodRules.guildId, guildId), eq(automodRules.id, ruleId)));
  }

  async applyPreset(guildId: string, preset: AutomodPresetKey): Promise<AutomodRuleRow[]> {
    const def = AUTOMOD_PRESETS[preset];
    if (!def) throw new NotFoundException('Unknown preset.');
    return this.create(guildId, def.build());
  }

  listPresets() {
    return Object.entries(AUTOMOD_PRESETS).map(([key, value]) => ({
      key,
      label: value.label,
      description: value.description,
    }));
  }

  recentEvents(guildId: string, limit = 50) {
    return this.db
      .select()
      .from(automodEvents)
      .where(eq(automodEvents.guildId, guildId))
      .orderBy(desc(automodEvents.createdAt))
      .limit(limit);
  }
}
