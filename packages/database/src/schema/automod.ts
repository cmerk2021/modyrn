import { boolean, index, integer, jsonb, pgTable, varchar } from 'drizzle-orm/pg-core';
import type {
  AutomodAction,
  AutomodConditionGroup,
  AutomodEventType,
} from '@modyrn/shared';
import { snowflake, timestamps } from './_shared.js';
import { guilds } from './guilds.js';

/**
 * A visual automod rule: `IF <event> AND <conditions> THEN <actions>`.
 * The condition tree and actions are stored as JSON so the dashboard rule
 * builder and the API engine share one serializable representation.
 */
export const automodRules = pgTable(
  'automod_rules',
  {
    id: varchar('id', { length: 26 }).primaryKey(),
    guildId: snowflake('guild_id')
      .notNull()
      .references(() => guilds.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    description: varchar('description', { length: 500 }),
    enabled: boolean('enabled').notNull().default(true),
    priority: integer('priority').notNull().default(0),
    event: varchar('event', { length: 32 }).$type<AutomodEventType>().notNull(),
    conditions: jsonb('conditions').$type<AutomodConditionGroup>().notNull(),
    actions: jsonb('actions').$type<AutomodAction[]>().notNull().default([]),
    stopProcessing: boolean('stop_processing').notNull().default(false),
    exemptRoleIds: jsonb('exempt_role_ids').$type<string[]>().notNull().default([]),
    exemptChannelIds: jsonb('exempt_channel_ids').$type<string[]>().notNull().default([]),
    ...timestamps,
  },
  (table) => ({
    guildEnabledIdx: index('automod_rules_guild_enabled_idx').on(table.guildId, table.enabled),
    priorityIdx: index('automod_rules_priority_idx').on(table.guildId, table.priority),
  }),
);

export type AutomodRuleRow = typeof automodRules.$inferSelect;
export type NewAutomodRuleRow = typeof automodRules.$inferInsert;

/**
 * A record of an automod rule firing. Powers analytics and the automod event
 * timeline.
 */
export const automodEvents = pgTable(
  'automod_events',
  {
    id: varchar('id', { length: 26 }).primaryKey(),
    guildId: snowflake('guild_id')
      .notNull()
      .references(() => guilds.id, { onDelete: 'cascade' }),
    ruleId: varchar('rule_id', { length: 26 }).references(() => automodRules.id, {
      onDelete: 'set null',
    }),
    userId: snowflake('user_id').notNull(),
    channelId: snowflake('channel_id'),
    /** The actions that were executed as a result of the match. */
    actionsTaken: jsonb('actions_taken').$type<AutomodAction[]>().notNull().default([]),
    /** A trimmed snapshot of the offending content for auditing. */
    contentSnapshot: varchar('content_snapshot', { length: 500 }),
    ...timestamps,
  },
  (table) => ({
    guildIdx: index('automod_events_guild_idx').on(table.guildId, table.createdAt),
    ruleIdx: index('automod_events_rule_idx').on(table.ruleId),
  }),
);

export type AutomodEventRow = typeof automodEvents.$inferSelect;
export type NewAutomodEventRow = typeof automodEvents.$inferInsert;
