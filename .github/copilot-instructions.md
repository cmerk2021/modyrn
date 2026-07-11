# Modyrn — Copilot instructions

Dashboard-first, self-hosted Discord moderation platform. pnpm + Turborepo
monorepo (`apps/*`, `packages/*`). See [README.md](../README.md) and
[docs/architecture.md](../docs/architecture.md) for context.

## Always bump the version when you make changes

Whenever you make a functional change to the codebase (features, fixes, or
notable refactors), bump the project version **in every place it appears** and
keep them all identical. Modyrn's release pipeline is driven by `version.txt`:
pushing a changed `version.txt` to `main` automatically tags, releases, and
publishes multi-arch Docker images. The `package.json` versions must stay in
lockstep with it.

### Versions must be identical in all of these files

1. `version.txt` — **source of truth**; the release workflow triggers on changes to it
2. `package.json` (root)
3. `apps/api/package.json`
4. `apps/bot/package.json`
5. `apps/dashboard/package.json`
6. `packages/config/package.json`
7. `packages/database/package.json`
8. `packages/shared/package.json`

All eight must show the exact same version string (e.g. `0.2.0`). `version.txt`
contains only the bare version and a trailing newline — no `v` prefix, no quotes.

### Choosing the new version (Semantic Versioning)

Follow [SemVer](https://semver.org/) `MAJOR.MINOR.PATCH`:

- **PATCH** (`0.1.0` → `0.1.1`) — bug fixes and internal changes with no API,
  schema, or behavior changes for users.
- **MINOR** (`0.1.0` → `0.2.0`) — new features, new dashboard pages, new API
  endpoints, additive database migrations — all backwards compatible.
- **MAJOR** (`0.1.0` → `1.0.0`) — breaking changes (removed/renamed API routes,
  incompatible schema migrations, config format changes).

While pre-1.0 (`0.x`), treat breaking changes as a MINOR bump.

### How to bump

1. Decide the new version from the change type above.
2. Update `version.txt`.
3. Update the `"version"` field in all seven `package.json` files to match.
4. If a database change was made, generate a migration (`pnpm db:generate`) and
   commit it alongside the version bump.
5. Do **not** create git tags or GitHub releases manually — CI does this when
   `version.txt` lands on `main`.

Only bump once per logical change set. If you make several edits to satisfy a
single request, apply a single coordinated version bump covering all of them.

## Project conventions

- TypeScript strict everywhere; ESM with `.js` import specifiers in Node apps
  (`apps/api`, `apps/bot`) and library packages.
- Configuration lives in the dashboard/database, **never** in Discord slash
  commands (commands are for immediate actions only).
- Before finishing a change, ensure it passes: `pnpm format:check`, `pnpm lint`,
  `pnpm typecheck`, `pnpm test`, and `pnpm build`.
- Database schema changes require a generated Drizzle migration under
  `packages/database/drizzle` (run `pnpm db:generate`).
