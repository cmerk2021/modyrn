import {
  bigint,
  date,
  index,
  jsonb,
  pgTable,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { snowflake, timestamps } from './_shared.js';
import { guilds } from './guilds.js';

/**
 * Immutable audit trail of dashboard actions (who changed what). Distinct from
 * moderation cases — this records platform configuration changes.
 */
export const auditLog = pgTable(
  'audit_log',
  {
    id: varchar('id', { length: 26 }).primaryKey(),
    guildId: snowflake('guild_id')
      .notNull()
      .references(() => guilds.id, { onDelete: 'cascade' }),
    actorId: snowflake('actor_id').notNull(),
    /** Dotted action key, e.g. "automod.rule.updated". */
    action: varchar('action', { length: 64 }).notNull(),
    /** Optional reference to the affected entity. */
    targetType: varchar('target_type', { length: 32 }),
    targetId: varchar('target_id', { length: 64 }),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    guildIdx: index('audit_log_guild_idx').on(table.guildId, table.createdAt),
    actorIdx: index('audit_log_actor_idx').on(table.actorId),
  }),
);

export type AuditLogEntry = typeof auditLog.$inferSelect;
export type NewAuditLogEntry = typeof auditLog.$inferInsert;

/**
 * Logical database backups initiated from the dashboard.
 */
export const backups = pgTable(
  'backups',
  {
    id: varchar('id', { length: 26 }).primaryKey(),
    guildId: snowflake('guild_id').references(() => guilds.id, { onDelete: 'cascade' }),
    /** pending | completed | failed */
    status: varchar('status', { length: 16 }).notNull().default('pending'),
    sizeBytes: bigint('size_bytes', { mode: 'number' }),
    location: varchar('location', { length: 500 }),
    error: varchar('error', { length: 1000 }),
    ...timestamps,
  },
  (table) => ({
    createdIdx: index('backups_created_idx').on(table.createdAt),
  }),
);

export type Backup = typeof backups.$inferSelect;

/** Metrics captured in a daily analytics snapshot. */
export interface AnalyticsMetrics {
  memberCount: number;
  joins: number;
  leaves: number;
  messages: number;
  casesCreated: number;
  automodEvents: number;
  moderatorActions: Record<string, number>;
}

/**
 * Daily analytics rollups per guild. Powers the analytics charts without
 * re-scanning event tables.
 */
export const analyticsSnapshots = pgTable(
  'analytics_snapshots',
  {
    id: varchar('id', { length: 26 }).primaryKey(),
    guildId: snowflake('guild_id')
      .notNull()
      .references(() => guilds.id, { onDelete: 'cascade' }),
    day: date('day').notNull(),
    metrics: jsonb('metrics').$type<AnalyticsMetrics>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    guildDayIdx: uniqueIndex('analytics_snapshots_guild_day_idx').on(table.guildId, table.day),
  }),
);

export type AnalyticsSnapshot = typeof analyticsSnapshots.$inferSelect;
export type NewAnalyticsSnapshot = typeof analyticsSnapshots.$inferInsert;
