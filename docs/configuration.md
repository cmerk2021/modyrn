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

Configuration is split so that, for a Docker deployment, you only touch a
handful of values. See [`.env.example`](../.env.example) for the fully annotated
file. The variables fall into three groups.

### 1. Required (all deployments)

| Variable                | Description                                                              |
| ----------------------- | ------------------------------------------------------------------------ |
| `PUBLIC_URL`            | The one public URL where users reach Modyrn (the dashboard). Also the base for the Discord OAuth callback. Use `https://` in production, no trailing slash. |
| `DISCORD_CLIENT_ID`     | OAuth client ID                                                          |
| `DISCORD_CLIENT_SECRET` | OAuth client secret                                                      |
| `DISCORD_TOKEN`         | Bot token                                                                |
| `DISCORD_PUBLIC_KEY`    | Application public key                                                   |
| `JWT_SECRET`            | Signs dashboard session tokens (`openssl rand -hex 32`)                  |
| `ENCRYPTION_KEY`        | 32-byte hex key (64 chars) encrypting stored secrets (`openssl rand -hex 32`) |

### 2. Docker deployment (have sensible defaults)

| Variable            | Default      | Description                                            |
| ------------------- | ------------ | ------------------------------------------------------ |
| `POSTGRES_USER`     | `modyrn`     | Database user for the bundled Postgres container       |
| `POSTGRES_PASSWORD` | `change-me`  | Database password — **change this**                    |
| `POSTGRES_DB`       | `modyrn`     | Database name                                          |
| `DASHBOARD_PORT`    | `3000`       | Host port the dashboard is published on                |
| `MODYRN_VERSION`    | `latest`     | Which published image tag to run                       |
| `LOG_LEVEL`         | `info`       | `fatal` \| `error` \| `warn` \| `info` \| `debug` \| `trace` |

### 3. Local development only

These are how the apps connect when you run them on your host with `pnpm dev`.
In a Docker deployment the compose file sets them internally, so you can ignore
them.

| Variable       | Description                                                                 |
| -------------- | --------------------------------------------------------------------------- |
| `DATABASE_URL` | PostgreSQL connection string (Docker builds this from the `POSTGRES_*` vars)|
| `REDIS_URL`    | Redis connection string (Docker sets `redis://redis:6379`)                  |
| `API_URL`      | **Internal, server-to-server only.** The address the dashboard uses to reach the API (`http://api:4000` in Docker). Never exposed to the browser, so there is no public API URL to configure. |
| `API_PORT`     | Port the API listens on internally (`4000`)                                 |

> **`PUBLIC_URL` vs `API_URL`.** `PUBLIC_URL` is the address your users' browsers
> use. `API_URL` is a private address one container uses to call another. The
> browser talks to the dashboard, and the dashboard proxies `/api/v1/*` to the
> API — so the API is never public and needs no DNS, no subdomain, and no
> reverse-proxy rule of its own.

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

Terminate TLS at a reverse proxy and forward **everything to the dashboard**.
Do not add a separate rule for the API — the dashboard proxies `/api/v1/*`
internally.

Example Caddyfile:

```caddy
modyrn.example.com {
    reverse_proxy localhost:3000
}
```

Then set `PUBLIC_URL=https://modyrn.example.com`.

## Secrets handling

Sensitive values stored at runtime (webhook URLs, third-party tokens) are
encrypted at rest with AES-256-GCM using `ENCRYPTION_KEY`. Rotating the key
requires re-encrypting stored secrets; see the Developer Guide.
