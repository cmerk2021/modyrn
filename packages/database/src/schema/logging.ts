import { boolean, pgTable, primaryKey, text, varchar } from 'drizzle-orm/pg-core';
import type { LogEventType } from '@modyrn/shared';
import { snowflake, timestamps } from './_shared.js';
import { guilds } from './guilds.js';

/**
 * Per-event logging configuration. Each event type can be enabled and routed to
 * a channel (and optionally an encrypted webhook) independently.
 */
export const logSettings = pgTable(
  'log_settings',
  {
    guildId: snowflake('guild_id')
      .notNull()
      .references(() => guilds.id, { onDelete: 'cascade' }),
    eventType: varchar('event_type', { length: 32 }).$type<LogEventType>().notNull(),
    enabled: boolean('enabled').notNull().default(false),
    channelId: snowflake('channel_id'),
    /** Optional encrypted webhook URL for delivery outside the bot. */
    webhookUrlEncrypted: text('webhook_url_encrypted'),
    ...timestamps,
  },
  (table) => ({
    pk: primaryKey({ columns: [table.guildId, table.eventType] }),
  }),
);

export type LogSetting = typeof logSettings.$inferSelect;
export type NewLogSetting = typeof logSettings.$inferInsert;
