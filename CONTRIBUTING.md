# Contributing to Modyrn

Thanks for your interest in improving Modyrn! This document explains how to get
a development environment running and the conventions we follow.

## Ground rules

- Be respectful. See our [Code of Conduct](./CODE_OF_CONDUCT.md).
- Keep pull requests focused. One logical change per PR.
- Write tests for new behavior.
- Update documentation alongside code — never leave docs for "later".

## Development environment

Requirements:

- **Node.js** 20.11 or newer
- **pnpm** 9 or newer (`corepack enable`)
- **Docker** (for local Postgres + Redis)

```bash
git clone https://github.com/modyrn/modyrn.git
cd modyrn
pnpm install
cp .env.example .env
docker compose -f docker/docker-compose.dev.yml up -d
pnpm db:migrate
pnpm dev
```

The dev server runs:

| App       | URL                     |
| --------- | ----------------------- |
| Dashboard | http://localhost:3000   |
| API       | http://localhost:4000   |

## Project layout

This is a Turborepo monorepo managed with pnpm workspaces. See
[docs/architecture.md](./docs/architecture.md).

## Coding standards

- TypeScript strict mode everywhere.
- Run `pnpm lint` and `pnpm typecheck` before pushing.
- Format with `pnpm format`.
- Prefer small, well-named modules over large files.
- Every exported symbol should be documented when its purpose isn't obvious.

## Commit messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(automod): add nested condition groups to the rule builder
fix(api): prevent duplicate cases on retried ban actions
docs: document the emergency center API
```

## Releasing

Releases are fully automated. Bump `version.txt`, push to `main`, and CI handles
tagging, GitHub Releases, and multi-arch Docker image publishing. See
[docs/developer-guide.md](./docs/developer-guide.md#releasing).

## Getting help

Open a [Discussion](https://github.com/modyrn/modyrn/discussions) or draft a PR
early — we're happy to help shape a change before it's finished.
