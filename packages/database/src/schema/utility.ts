import { boolean, index, jsonb, pgTable, primaryKey, timestamp, varchar } from 'drizzle-orm/pg-core';
import type { ManagedMessage, UtilityModule } from '@modyrn/shared';
import { snowflake, timestamps } from './_shared.js';
import { guilds } from './guilds.js';

/**
 * Per-module utility configuration. Each utility module (welcome messages,
 * starboard, suggestions, …) stores its serializable config here.
 */
export const utilityConfigs = pgTable(
  'utility_configs',
  {
    guildId: snowflake('guild_id')
      .notNull()
      .references(() => guilds.id, { onDelete: 'cascade' }),
    module: varchar('module', { length: 32 }).$type<UtilityModule>().notNull(),
    enabled: boolean('enabled').notNull().default(false),
    config: jsonb('config').$type<Record<string, unknown>>().notNull().default({}),
    ...timestamps,
  },
  (table) => ({
    pk: primaryKey({ columns: [table.guildId, table.module] }),
  }),
);

export type UtilityConfig = typeof utilityConfigs.$inferSelect;
export type NewUtilityConfig = typeof utilityConfigs.$inferInsert;

/**
 * Reusable embed/message templates authored in the visual embed builder.
 */
export const embedTemplates = pgTable(
  'embed_templates',
  {
    id: varchar('id', { length: 26 }).primaryKey(),
    guildId: snowflake('guild_id')
      .notNull()
      .references(() => guilds.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    message: jsonb('message').$type<ManagedMessage>().notNull(),
    ...timestamps,
  },
  (table) => ({
    guildIdx: index('embed_templates_guild_idx').on(table.guildId),
  }),
);

export type EmbedTemplate = typeof embedTemplates.$inferSelect;
export type NewEmbedTemplate = typeof embedTemplates.$inferInsert;

/**
 * A message managed by Modyrn that has been sent to Discord — allows later
 * editing of the live message (e.g. rules, announcements).
 */
export const managedMessages = pgTable(
  'managed_messages',
  {
    id: varchar('id', { length: 26 }).primaryKey(),
    guildId: snowflake('guild_id')
      .notNull()
      .references(() => guilds.id, { onDelete: 'cascade' }),
    channelId: snowflake('channel_id').notNull(),
    /** The Discord message ID once sent. */
    discordMessageId: snowflake('discord_message_id'),
    message: jsonb('message').$type<ManagedMessage>().notNull(),
    ...timestamps,
  },
  (table) => ({
    guildIdx: index('managed_messages_guild_idx').on(table.guildId),
  }),
);

export type ManagedMessageRow = typeof managedMessages.$inferSelect;

/**
 * Scheduled or recurring message sends.
 */
export const scheduledMessages = pgTable(
  'scheduled_messages',
  {
    id: varchar('id', { length: 26 }).primaryKey(),
    guildId: snowflake('guild_id')
      .notNull()
      .references(() => guilds.id, { onDelete: 'cascade' }),
    channelId: snowflake('channel_id').notNull(),
    message: jsonb('message').$type<ManagedMessage>().notNull(),
    sendAt: timestamp('send_at', { withTimezone: true }).notNull(),
    /** Optional cron expression for recurring sends. */
    recurrence: varchar('recurrence', { length: 100 }),
    sent: boolean('sent').notNull().default(false),
    ...timestamps,
  },
  (table) => ({
    dueIdx: index('scheduled_messages_due_idx').on(table.sent, table.sendAt),
  }),
);

export type ScheduledMessage = typeof scheduledMessages.$inferSelect;
export type NewScheduledMessage = typeof scheduledMessages.$inferInsert;

/** Mapping entry for a reaction/button/select role. */
export interface RoleMapping {
  /** Emoji (unicode or custom id) or component value. */
  key: string;
  roleId: string;
  label?: string;
}

/**
 * Reaction / button / select-menu role configurations bound to a message.
 */
export const reactionRoles = pgTable(
  'reaction_roles',
  {
    id: varchar('id', { length: 26 }).primaryKey(),
    guildId: snowflake('guild_id')
      .notNull()
      .references(() => guilds.id, { onDelete: 'cascade' }),
    channelId: snowflake('channel_id').notNull(),
    messageId: snowflake('message_id'),
    /** reaction | button | select */
    type: varchar('type', { length: 12 }).notNull().default('reaction'),
    /** Whether selecting one option removes the others (exclusive). */
    exclusive: boolean('exclusive').notNull().default(false),
    mappings: jsonb('mappings').$type<RoleMapping[]>().notNull().default([]),
    ...timestamps,
  },
  (table) => ({
    guildIdx: index('reaction_roles_guild_idx').on(table.guildId),
    messageIdx: index('reaction_roles_message_idx').on(table.messageId),
  }),
);

export type ReactionRole = typeof reactionRoles.$inferSelect;
export type NewReactionRole = typeof reactionRoles.$inferInsert;
