import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

/**
 * Applies all pending migrations from the `drizzle` folder. Run via
 * `pnpm db:migrate`. Also invoked automatically on API startup.
 */
export async function runMigrations(connectionString = process.env.DATABASE_URL): Promise<void> {
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set.');
  }

  const migrationsFolder = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'drizzle');
  const client = postgres(connectionString, { max: 1 });

  try {
    const db = drizzle(client);
    await migrate(db, { migrationsFolder });
    // eslint-disable-next-line no-console
    console.info('[modyrn:db] migrations applied successfully');
  } finally {
    await client.end({ timeout: 5 });
  }
}

// Allow running directly: `tsx src/migrate.ts`.
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations().catch((error) => {
    console.error('[modyrn:db] migration failed', error);
    process.exit(1);
  });
}
