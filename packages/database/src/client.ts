import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres, { type Sql } from 'postgres';
import * as schema from './schema/index.js';

export type Database = PostgresJsDatabase<typeof schema>;

export interface CreateDatabaseOptions {
  /** PostgreSQL connection string. Defaults to `DATABASE_URL`. */
  connectionString?: string;
  /** Maximum pool size. */
  max?: number;
  /** Enable query logging. */
  logger?: boolean;
}

export interface DatabaseHandle {
  db: Database;
  /** The underlying postgres-js client, exposed for health checks & shutdown. */
  client: Sql;
  /** Gracefully close the connection pool. */
  close: () => Promise<void>;
}

/**
 * Creates a Drizzle database instance backed by a postgres-js connection pool.
 * The caller owns the returned handle and is responsible for calling `close()`
 * on shutdown.
 */
export function createDatabase(options: CreateDatabaseOptions = {}): DatabaseHandle {
  const connectionString = options.connectionString ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set and no connectionString was provided.');
  }

  const client = postgres(connectionString, {
    max: options.max ?? 10,
    // Drizzle handles types; disable postgres-js's own transform.
    prepare: false,
  });

  const db = drizzle(client, { schema, logger: options.logger ?? false });

  return {
    db,
    client,
    close: async () => {
      await client.end({ timeout: 5 });
    },
  };
}
