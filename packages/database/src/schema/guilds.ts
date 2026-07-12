import { boolean, index, jsonb, pgTable, varchar } from 'drizzle-orm/pg-core';
import type { ComplexityMode } from '@modyrn/shared';
import { snowflake, timestamps } from './_shared.js';

/**
 * Guild-level settings. Serializable, evolving configuration lives in `settings`
 * so we avoid schema churn for feature flags.
 */
export interface GuildSettings {
  /** Channel used as the default moderation log destination. */
  modLogChannelId?: string;
  /** Role applied to quarantined members by the default `/quarantine` action. */
  quarantineRoleId?: string;
  /**
   * The role that normally grants members the ability to speak. Emergency
   * actions (freeze chat, lock channel) override permissions on this role
   * instead of `@everyone`, which is correct for servers gated behind a member
   * role. Falls back to `@everyone` when unset.
   */
  memberRoleId?: string;
  /** Timezone used when rendering scheduled content, e.g. "Europe/London". */
  timezone?: string;
  /** Default DM-on-action behavior for moderation. */
  dmOnAction?: boolean;
  /** Feature toggles keyed by module name. */
  modules?: Record<string, boolean>;
}

/**
 * A Discord guild connected to Modyrn. The row key is the Discord guild ID.
 */
export const guilds = pgTable(
  'guilds',
  {
    id: snowflake('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    icon: varchar('icon', { length: 255 }),
    ownerId: snowflake('owner_id').notNull(),
    /** Progressive complexity mode: simple | advanced | expert. */
    complexityMode: varchar('complexity_mode', { length: 20 })
      .$type<ComplexityMode>()
      .notNull()
      .default('simple'),
    settings: jsonb('settings').$type<GuildSettings>().notNull().default({}),
    /** Whether the bot is currently present in the guild. */
    botPresent: boolean('bot_present').notNull().default(false),
    /** Set once the first-run setup wizard has been completed. */
    setupCompleted: boolean('setup_completed').notNull().default(false),
    ...timestamps,
  },
  (table) => ({
    ownerIdx: index('guilds_owner_idx').on(table.ownerId),
  }),
);

export type Guild = typeof guilds.$inferSelect;
export type NewGuild = typeof guilds.$inferInsert;
