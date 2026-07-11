import { defineConfig } from 'drizzle-kit';

/**
 * Drizzle Kit configuration.
 *
 * The schema is loaded from the compiled output under `dist` rather than `src`:
 * the source files use explicit `.js` import specifiers (required for valid ESM
 * output consumed by the API and bot at runtime), which drizzle-kit's loader
 * cannot resolve against `.ts` files. Run `pnpm build` (or `pnpm db:generate`,
 * which builds first) before generating migrations. Output is written to
 * `./drizzle`.
 */
export default defineConfig({
  schema: './dist/schema/index.js',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgresql://modyrn:modyrn@localhost:5432/modyrn',
  },
  strict: true,
  verbose: true,
});
