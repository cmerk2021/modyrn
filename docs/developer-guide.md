# Developer Guide

This guide covers working on Modyrn itself.

## Prerequisites

- Node.js 20.11+
- pnpm 9+ (`corepack enable && corepack prepare pnpm@latest --activate`)
- Docker (for Postgres + Redis)

## Bootstrapping

```bash
pnpm install
cp .env.example .env
docker compose -f docker/docker-compose.dev.yml up -d
pnpm db:migrate
pnpm dev
```

`pnpm dev` runs every app in parallel through Turborepo.

## Monorepo layout

| Path                 | Package                | Description                        |
| -------------------- | ---------------------- | ---------------------------------- |
| `apps/dashboard`     | `@modyrn/dashboard`    | Next.js dashboard                  |
| `apps/api`           | `@modyrn/api`          | NestJS API                         |
| `apps/bot`           | `@modyrn/bot`          | discord.js gateway agent           |
| `packages/database`  | `@modyrn/database`     | Drizzle schema, migrations, client |
| `packages/shared`    | `@modyrn/shared`       | Shared types, constants, schemas   |
| `packages/ui`        | `@modyrn/ui`           | Shared shadcn/ui components         |
| `packages/config`    | `@modyrn/config`       | ESLint / TS / Tailwind config      |

## Common commands

| Command             | Description                              |
| ------------------- | ---------------------------------------- |
| `pnpm dev`          | Run all apps in watch mode               |
| `pnpm build`        | Build everything                         |
| `pnpm lint`         | Lint all packages                        |
| `pnpm typecheck`    | Type-check all packages                  |
| `pnpm test`         | Run all test suites                      |
| `pnpm format`       | Format with Prettier                     |
| `pnpm db:generate`  | Generate a new Drizzle migration         |
| `pnpm db:migrate`   | Apply pending migrations                 |
| `pnpm db:studio`    | Open Drizzle Studio                      |

## Database workflow

The schema lives in `packages/database/src/schema`. After editing it:

```bash
pnpm db:generate   # creates a SQL migration under packages/database/drizzle
pnpm db:migrate    # applies it to your local database
```

## Testing

- Unit tests colocate with source as `*.spec.ts`.
- The API uses Jest; the dashboard uses Vitest + Testing Library.
- Run a single package's tests with `pnpm --filter @modyrn/api test`.

## Releasing

Releases are automated. To cut a release:

1. Update `version.txt` to the new [SemVer](https://semver.org/) version.
2. Commit and push to `main`.

CI then:

- runs tests, linting and type-checks
- builds the frontend and backend
- creates a git tag `vX.Y.Z`
- generates release notes and a GitHub Release
- builds multi-arch (amd64 + arm64) Docker images
- publishes them to the GitHub Container Registry and updates `latest`

There are **no** manual tags, releases or Docker pushes.

## Code style

- TypeScript strict mode.
- Prefer composition and small modules.
- Keep configuration in the dashboard/database, never in slash commands.
- Document non-obvious exports.
