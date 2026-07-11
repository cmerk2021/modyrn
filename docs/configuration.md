# Configuration

Modyrn is configured in two layers:

1. **Host configuration** via environment variables (`.env`) — infrastructure
   concerns such as database, Redis, secrets and Discord credentials.
2. **Runtime configuration** via the dashboard — everything else. Automod,
   logging, roles, welcome messages, permissions and so on all live in the
   database and are edited through the UI.

Modyrn deliberately keeps runtime configuration **out** of environment variables
and **out** of Discord slash commands.

## Environment variables

See [`.env.example`](../.env.example) for the full annotated list. The essentials:

| Variable         | Required | Description                                  |
| ---------------- | -------- | -------------------------------------------- |
| `DATABASE_URL`   | yes      | PostgreSQL connection string                 |
| `REDIS_URL`      | yes      | Redis connection string                      |
| `DISCORD_TOKEN`  | yes      | Bot token                                    |
| `DISCORD_CLIENT_ID` | yes   | OAuth client ID                              |
| `DISCORD_CLIENT_SECRET` | yes | OAuth client secret                       |
| `JWT_SECRET`     | yes      | Signs dashboard session tokens               |
| `ENCRYPTION_KEY` | yes      | 32-byte hex key encrypting stored secrets    |
| `PUBLIC_URL`     | yes      | External dashboard URL for OAuth redirects   |
| `LOG_LEVEL`      | no       | `debug` \| `info` \| `warn` \| `error`       |

## Progressive complexity modes

Each guild has a **complexity mode** that controls how much of the dashboard is
revealed:

- **Simple** — welcome messages, moderation log, automod presets, warnings,
  reaction roles.
- **Advanced** — granular moderation, detailed logging, custom durations, role
  configuration, utility modules.
- **Expert** — visual automod builder, emergency center, analytics, advanced
  permissions, custom workflows, webhooks, API integrations.

Change it under **Settings → General**.

## Backups

Modyrn stores all state in PostgreSQL. Back it up with `pg_dump`:

```bash
docker compose exec postgres pg_dump -U modyrn modyrn > modyrn-backup.sql
```

The dashboard's **Backups** page can schedule and download logical backups.

## Reverse proxy

Example Caddyfile:

```caddy
your-domain {
    reverse_proxy /api/* api:4000
    reverse_proxy dashboard:3000
}
```

## Secrets handling

Sensitive values stored at runtime (webhook URLs, third-party tokens) are
encrypted at rest with AES-256-GCM using `ENCRYPTION_KEY`. Rotating the key
requires re-encrypting stored secrets; see the Developer Guide.
