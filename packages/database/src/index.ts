/**
 * @modyrn/database
 *
 * Drizzle ORM schema, typed client and migration runner. Single source of truth
 * for Modyrn's data model.
 */

export * from './client.js';
export * from './migrate.js';
export * as schema from './schema/index.js';
export * from './schema/index.js';

// Re-export common Drizzle query helpers so consumers don't need a direct
// drizzle-orm dependency for basic queries.
export {
  and,
  or,
  not,
  eq,
  ne,
  gt,
  gte,
  lt,
  lte,
  like,
  ilike,
  inArray,
  isNull,
  isNotNull,
  desc,
  asc,
  sql,
  count,
} from 'drizzle-orm';
