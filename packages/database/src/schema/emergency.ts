import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import type { QuarantineTarget } from '@modyrn/shared';
import { snowflake, timestamps } from './_shared.js';
import { guilds } from './guilds.js';

/**
 * A reusable quarantine profile describing who to quarantine and how. Quarantine
 * is a flagship feature — profiles make repeatable, auditable containment easy.
 */
export const quarantineProfiles = pgTable(
  'quarantine_profiles',
  {
    id: varchar('id', { length: 26 }).primaryKey(),
    guildId: snowflake('guild_id')
      .notNull()
      .references(() => guilds.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    description: varchar('description', { length: 500 }),
    target: varchar('target', { length: 24 }).$type<QuarantineTarget>().notNull(),
    quarantineRoleId: snowflake('quarantine_role_id').notNull(),
    stripRoles: boolean('strip_roles').notNull().default(true),
    durationMinutes: integer('duration_minutes'),
    recentWindowMinutes: integer('recent_window_minutes'),
    /** Optional serialized filter for target = matching_filter. */
    filter: jsonb('filter').$type<Record<string, unknown>>(),
    ...timestamps,
  },
  (table) => ({
    guildIdx: index('quarantine_profiles_guild_idx').on(table.guildId),
  }),
);

export type QuarantineProfileRow = typeof quarantineProfiles.$inferSelect;
export type NewQuarantineProfileRow = typeof quarantineProfiles.$inferInsert;

/**
 * An active or historical quarantine applied to a member. Stores the roles that
 * were stripped so they can be restored on release.
 */
export const quarantineRecords = pgTable(
  'quarantine_records',
  {
    id: varchar('id', { length: 26 }).primaryKey(),
    guildId: snowflake('guild_id')
      .notNull()
      .references(() => guilds.id, { onDelete: 'cascade' }),
    userId: snowflake('user_id').notNull(),
    profileId: varchar('profile_id', { length: 26 }).references(() => quarantineProfiles.id, {
      onDelete: 'set null',
    }),
    caseId: varchar('case_id', { length: 26 }),
    strippedRoleIds: jsonb('stripped_role_ids').$type<string[]>().notNull().default([]),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    releasedAt: timestamp('released_at', { withTimezone: true }),
    ...timestamps,
  },
  (table) => ({
    activeIdx: index('quarantine_records_active_idx').on(table.guildId, table.releasedAt),
    expiresIdx: index('quarantine_records_expires_idx').on(table.expiresAt),
  }),
);

export type QuarantineRecord = typeof quarantineRecords.$inferSelect;
export type NewQuarantineRecord = typeof quarantineRecords.$inferInsert;

/**
 * The current emergency posture of a guild. One row per guild.
 */
export const emergencyStates = pgTable('emergency_states', {
  guildId: snowflake('guild_id')
    .primaryKey()
    .references(() => guilds.id, { onDelete: 'cascade' }),
  raidModeEnabled: boolean('raid_mode_enabled').notNull().default(false),
  chatFrozen: boolean('chat_frozen').notNull().default(false),
  serverLocked: boolean('server_locked').notNull().default(false),
  invitesRestricted: boolean('invites_restricted').notNull().default(false),
  activatedBy: snowflake('activated_by'),
  activatedAt: timestamp('activated_at', { withTimezone: true }),
  ...timestamps,
});

export type EmergencyStateRow = typeof emergencyStates.$inferSelect;
