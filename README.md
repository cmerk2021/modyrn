<div align="center">

# Modyrn

### Dashboard-first moderation for modern Discord communities.

Modyrn is a **self-hosted moderation platform**, not a Discord bot. The bot is
simply an agent connected to the platform — **the dashboard is the product.**

[![CI](https://github.com/modyrn/modyrn/actions/workflows/ci.yml/badge.svg)](https://github.com/modyrn/modyrn/actions/workflows/ci.yml)
[![Release](https://github.com/modyrn/modyrn/actions/workflows/release.yml/badge.svg)](https://github.com/modyrn/modyrn/actions/workflows/release.yml)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](./LICENSE)

</div>

---

## Why Modyrn?

Most Discord moderation tools are bots first and dashboards second. Modyrn flips
that model. Configuration lives in a fast, beautiful web dashboard. Discord slash
commands are reserved strictly for immediate actions (`/warn`, `/ban`, `/timeout`,
`/purge`, `/quarantine`).

Modyrn is designed to feel like professional infrastructure software — think
Grafana, Portainer, Home Assistant, or the UniFi Network dashboard — that happens
to integrate with Discord.

## Highlights

- **Progressive complexity** — Simple, Advanced and Expert modes so a 10-member
  server is never overwhelmed while a 500,000-member community is never limited.
- **Member Explorer** — fast search, filtering, bulk actions, and rich per-member
  profiles with full moderation history.
- **Visual automod rule builder** — `IF … AND … THEN …` workflows with nested
  conditions, priorities, and simulation.
- **Emergency Center** — one-click raid mode, chat freeze, mass quarantine, and
  lockdown.
- **Visual embed builder** — build rich Discord embeds with live preview,
  variables, templates and scheduling. Never write embed JSON by hand.
- **Effortless deployment** — `docker compose up -d`.

## Architecture

Modyrn is a TypeScript monorepo:

```
apps/
  dashboard/   Next.js App Router dashboard (the product)
  api/         NestJS API + job queue + Discord REST
  bot/         discord.js gateway agent
packages/
  database/    Drizzle ORM schema & migrations
  shared/      Shared types, constants and Zod schemas
  ui/          Shared shadcn/ui component library
  config/      Shared ESLint / TypeScript / Tailwind config
docker/        Container & compose definitions
docs/          Documentation
```

See [docs/architecture.md](./docs/architecture.md) for the full picture.

## Quick start (self-hosting)

```bash
# 1. Grab the compose file
curl -O https://raw.githubusercontent.com/modyrn/modyrn/main/docker/docker-compose.yml

# 2. Configure your environment
cp .env.example .env
# edit .env with your Discord credentials

# 3. Launch
docker compose up -d
```

Then open the dashboard and follow the setup wizard.

Full guide: [docs/installation.md](./docs/installation.md).

## Local development

Requirements: **Node 20.11+**, **pnpm 9+**, **Docker** (for Postgres & Redis).

```bash
pnpm install
cp .env.example .env
docker compose -f docker/docker-compose.dev.yml up -d   # Postgres + Redis
pnpm db:migrate
pnpm dev
```

More detail in the [Developer Guide](./docs/developer-guide.md).

## Documentation

- [Installation](./docs/installation.md)
- [Configuration](./docs/configuration.md)
- [Architecture](./docs/architecture.md)
- [Developer Guide](./docs/developer-guide.md)
- [API Reference](./docs/api.md)
- [Contributing](./CONTRIBUTING.md)

## License

Modyrn is licensed under the [GNU AGPL-3.0](./LICENSE).
