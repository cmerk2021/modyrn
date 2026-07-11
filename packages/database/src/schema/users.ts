import { pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { snowflake, timestamps } from './_shared.js';

/**
 * A person who signs into the Modyrn dashboard via Discord OAuth. The row key is
 * the Discord user ID.
 */
export const dashboardUsers = pgTable('dashboard_users', {
  id: snowflake('id').primaryKey(),
  username: varchar('username', { length: 32 }).notNull(),
  globalName: varchar('global_name', { length: 32 }),
  avatar: varchar('avatar', { length: 255 }),
  ...timestamps,
});

export type DashboardUser = typeof dashboardUsers.$inferSelect;
export type NewDashboardUser = typeof dashboardUsers.$inferInsert;

/**
 * Encrypted Discord OAuth tokens. Access/refresh tokens are stored encrypted at
 * rest (AES-256-GCM) and only decrypted server-side when needed.
 */
export const oauthTokens = pgTable('oauth_tokens', {
  userId: snowflake('user_id')
    .primaryKey()
    .references(() => dashboardUsers.id, { onDelete: 'cascade' }),
  /** Ciphertext (base64) of the access token. */
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token').notNull(),
  scope: text('scope').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  ...timestamps,
});

export type OAuthToken = typeof oauthTokens.$inferSelect;

/**
 * Server-side session records. The dashboard receives an httpOnly cookie holding
 * the session ID; the token hash is stored here so sessions can be revoked.
 */
export const sessions = pgTable('sessions', {
  id: varchar('id', { length: 64 }).primaryKey(),
  userId: snowflake('user_id')
    .notNull()
    .references(() => dashboardUsers.id, { onDelete: 'cascade' }),
  tokenHash: varchar('token_hash', { length: 128 }).notNull(),
  userAgent: text('user_agent'),
  ipAddress: varchar('ip_address', { length: 64 }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  ...timestamps,
});

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
