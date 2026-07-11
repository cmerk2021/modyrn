import {
  bigint,
  index,
  integer,
  jsonb,
  pgTable,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import type {
  ActionOrigin,
  CaseSeverity,
  CaseStatus,
  ModerationActionType,
} from '@modyrn/shared';
import { snowflake, timestamps } from './_shared.js';
import { guilds } from './guilds.js';

/** Structured evidence attached to a case (message links, attachments, notes). */
export interface CaseEvidence {
  messageLinks?: string[];
  attachmentUrls?: string[];
  note?: string;
}

/**
 * A moderation case. Every moderation action creates one. Cases carry a
 * per-guild sequential number for human-friendly reference (e.g. "Case #128").
 */
export const cases = pgTable(
  'cases',
  {
    id: varchar('id', { length: 26 }).primaryKey(),
    guildId: snowflake('guild_id')
      .notNull()
      .references(() => guilds.id, { onDelete: 'cascade' }),
    /** Sequential, human-friendly identifier within the guild. */
    caseNumber: integer('case_number').notNull(),
    action: varchar('action', { length: 24 }).$type<ModerationActionType>().notNull(),
    status: varchar('status', { length: 16 }).$type<CaseStatus>().notNull().default('open'),
    severity: varchar('severity', { length: 12 }).$type<CaseSeverity>().notNull().default('low'),
    origin: varchar('origin', { length: 16 }).$type<ActionOrigin>().notNull().default('dashboard'),
    targetUserId: snowflake('target_user_id').notNull(),
    moderatorId: snowflake('moderator_id').notNull(),
    reason: varchar('reason', { length: 2000 }),
    /** For temporary actions: duration in milliseconds. */
    durationMs: bigint('duration_ms', { mode: 'number' }),
    /** When a temporary action should automatically expire. */
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    evidence: jsonb('evidence').$type<CaseEvidence>(),
    /** Arbitrary structured metadata (e.g. automod rule id, purged count). */
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    ...timestamps,
  },
  (table) => ({
    guildCaseNumberIdx: uniqueIndex('cases_guild_case_number_idx').on(
      table.guildId,
      table.caseNumber,
    ),
    targetIdx: index('cases_target_idx').on(table.guildId, table.targetUserId),
    moderatorIdx: index('cases_moderator_idx').on(table.guildId, table.moderatorId),
    statusIdx: index('cases_status_idx').on(table.guildId, table.status),
    expiresIdx: index('cases_expires_idx').on(table.expiresAt),
  }),
);

export type Case = typeof cases.$inferSelect;
export type NewCase = typeof cases.$inferInsert;

/** Appeal against a case, submitted by the affected user. */
export const appeals = pgTable(
  'appeals',
  {
    id: varchar('id', { length: 26 }).primaryKey(),
    caseId: varchar('case_id', { length: 26 })
      .notNull()
      .references(() => cases.id, { onDelete: 'cascade' }),
    guildId: snowflake('guild_id')
      .notNull()
      .references(() => guilds.id, { onDelete: 'cascade' }),
    userId: snowflake('user_id').notNull(),
    content: varchar('content', { length: 4000 }).notNull(),
    /** pending | accepted | rejected */
    status: varchar('status', { length: 16 }).notNull().default('pending'),
    resolvedBy: snowflake('resolved_by'),
    resolutionNote: varchar('resolution_note', { length: 2000 }),
    ...timestamps,
  },
  (table) => ({
    caseIdx: index('appeals_case_idx').on(table.caseId),
    guildStatusIdx: index('appeals_guild_status_idx').on(table.guildId, table.status),
  }),
);

export type Appeal = typeof appeals.$inferSelect;
export type NewAppeal = typeof appeals.$inferInsert;
