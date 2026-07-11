import { index, integer, jsonb, pgTable, primaryKey, varchar } from 'drizzle-orm/pg-core';
import type { DashboardPermission } from '@modyrn/shared';
import { snowflake, timestamps } from './_shared.js';
import { guilds } from './guilds.js';
import { dashboardUsers } from './users.js';

/**
 * Dashboard roles — Modyrn's own permission model, separate from Discord roles.
 * A dashboard role bundles granular capabilities.
 */
export const dashboardRoles = pgTable(
  'dashboard_roles',
  {
    id: varchar('id', { length: 26 }).primaryKey(),
    guildId: snowflake('guild_id')
      .notNull()
      .references(() => guilds.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 60 }).notNull(),
    /** Hex color for UI display, e.g. "#5865F2". */
    color: varchar('color', { length: 7 }).notNull().default('#5865F2'),
    permissions: jsonb('permissions')
      .$type<(DashboardPermission | '*')[]>()
      .notNull()
      .default([]),
    /** Lower position sorts higher in the UI. */
    position: integer('position').notNull().default(0),
    ...timestamps,
  },
  (table) => ({
    guildIdx: index('dashboard_roles_guild_idx').on(table.guildId),
  }),
);

export type DashboardRole = typeof dashboardRoles.$inferSelect;
export type NewDashboardRole = typeof dashboardRoles.$inferInsert;

/**
 * Assignment of a dashboard role to a user within a guild. A user may hold
 * multiple dashboard roles; their effective permissions are the union.
 */
export const dashboardRoleAssignments = pgTable(
  'dashboard_role_assignments',
  {
    guildId: snowflake('guild_id')
      .notNull()
      .references(() => guilds.id, { onDelete: 'cascade' }),
    userId: snowflake('user_id')
      .notNull()
      .references(() => dashboardUsers.id, { onDelete: 'cascade' }),
    roleId: varchar('role_id', { length: 26 })
      .notNull()
      .references(() => dashboardRoles.id, { onDelete: 'cascade' }),
    ...timestamps,
  },
  (table) => ({
    pk: primaryKey({ columns: [table.guildId, table.userId, table.roleId] }),
    userIdx: index('dashboard_role_assignments_user_idx').on(table.guildId, table.userId),
  }),
);

export type DashboardRoleAssignment = typeof dashboardRoleAssignments.$inferSelect;
