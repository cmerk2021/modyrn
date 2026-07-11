import { sql } from 'drizzle-orm';
import { timestamp, varchar } from 'drizzle-orm/pg-core';

/**
 * Discord snowflake IDs are 64-bit and safest stored as strings to avoid
 * JavaScript number precision loss.
 */
export const snowflake = (name: string) => varchar(name, { length: 20 });

/** Standard created/updated timestamp columns shared by most tables. */
export const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
};
