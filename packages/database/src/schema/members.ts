import {
  boolean,
  index,
  jsonb,
  pgTable,
  primaryKey,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { snowflake, timestamps } from './_shared.js';
import { guilds } from './guilds.js';

/**
 * Cached snapshot of a guild member, kept in sync by the bot agent. This backs
 * the fast Member Explorer without hammering Discord on every request.
 */
export const guildMembers = pgTable(
  'guild_members',
  {
    guildId: snowflake('guild_id')
      .notNull()
      .references(() => guilds.id, { onDelete: 'cascade' }),
    userId: snowflake('user_id').notNull(),
    username: varchar('username', { length: 32 }).notNull(),
    globalName: varchar('global_name', { length: 32 }),
    nickname: varchar('nickname', { length: 32 }),
    avatar: varchar('avatar', { length: 255 }),
    isBot: boolean('is_bot').notNull().default(false),
    /** Array of Discord role IDs. */
    roleIds: jsonb('role_ids').$type<string[]>().notNull().default([]),
    joinedAt: timestamp('joined_at', { withTimezone: true }),
    /** Derived from the snowflake — the Discord account creation time. */
    accountCreatedAt: timestamp('account_created_at', { withTimezone: true }),
    /** True while the member is currently in the guild. */
    present: boolean('present').notNull().default(true),
    ...timestamps,
  },
  (table) => ({
    pk: primaryKey({ columns: [table.guildId, table.userId] }),
    usernameIdx: index('guild_members_username_idx').on(table.guildId, table.username),
    joinedIdx: index('guild_members_joined_idx').on(table.guildId, table.joinedAt),
  }),
);

export type GuildMember = typeof guildMembers.$inferSelect;
export type NewGuildMember = typeof guildMembers.$inferInsert;

/**
 * Free-form moderator notes attached to a member. Distinct from cases — notes
 * are internal context, not disciplinary actions.
 */
export const memberNotes = pgTable(
  'member_notes',
  {
    id: varchar('id', { length: 26 }).primaryKey(),
    guildId: snowflake('guild_id')
      .notNull()
      .references(() => guilds.id, { onDelete: 'cascade' }),
    userId: snowflake('user_id').notNull(),
    authorId: snowflake('author_id').notNull(),
    content: varchar('content', { length: 2000 }).notNull(),
    ...timestamps,
  },
  (table) => ({
    memberIdx: index('member_notes_member_idx').on(table.guildId, table.userId),
  }),
);

export type MemberNote = typeof memberNotes.$inferSelect;
export type NewMemberNote = typeof memberNotes.$inferInsert;
