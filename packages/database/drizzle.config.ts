import { defineConfig } from 'drizzle-kit';

/**
 * Drizzle Kit configuration. Migrations are generated from the schema under
 * `src/schema` and written to `./drizzle`.
 */
export default defineConfig({
  schema: './src/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgresql://modyrn:modyrn@localhost:5432/modyrn',
  },
  strict: true,
  verbose: true,
});
