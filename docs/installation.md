# Installation

Modyrn is designed to be self-hosted with Docker. Production installs never
require building from source — you pull pre-built images and run them.

## How Modyrn is wired (read this first)

Understanding the network layout makes the environment variables obvious:

```
                    ┌─────────────────────────── your server ───────────────────────────┐
                    │                          (Docker network)                          │
   Browser ──────►  │  dashboard ──/api/v1/*──►  api ──►  postgres                        │
   (PUBLIC_URL)     │   :3000                    :4000    redis                           │
                    │     ▲                        ▲                                      │
                    │     │                    bot :(gateway)                             │
                    └─────┼──────────────────────────────────────────────────────────────┘
                          │
                  reverse proxy (TLS)
```

- **Only the dashboard is exposed to the internet.** Users hit it at
  `PUBLIC_URL`.
- The dashboard **proxies** `/api/v1/*` requests to the API over the internal
  Docker network. **The API is never published publicly** — you do not need a
  second subdomain or a reverse-proxy rule for it.
- The bot, API, PostgreSQL and Redis all talk to each other privately inside
  the Docker network.

Because of this, there is exactly **one** public address to think about:
`PUBLIC_URL`. That is why the Discord OAuth callback also goes through
`PUBLIC_URL` (the dashboard forwards it to the API).

> **Why isn't there a `NEXT_PUBLIC_API_URL`?** There used to be, and it caused
> exactly the confusion you'd expect. The browser never calls the API directly —
> it calls the dashboard's own origin, which proxies to the API server-side. So
> no public API URL is needed.

## Prerequisites

- A host with **Docker** and the **Docker Compose** plugin.
- A **domain name** pointed at your server (recommended for production so you
  can serve HTTPS).
- A **Discord application** (bot token + OAuth credentials).

## 1. Create a Discord application

1. Open the [Discord Developer Portal](https://discord.com/developers/applications)
   and create a **New Application**.
2. **General Information** → copy the **Public Key** (`DISCORD_PUBLIC_KEY`).
3. **Bot** → **Reset Token** and copy it (`DISCORD_TOKEN`). Under **Privileged
   Gateway Intents**, enable **Server Members Intent** and **Message Content
   Intent**.
4. **OAuth2** → copy the **Client ID** (`DISCORD_CLIENT_ID`) and **Client
   Secret** (`DISCORD_CLIENT_SECRET`).
5. **OAuth2 → Redirects** → add a redirect that matches your `PUBLIC_URL`
   exactly, with this path:

   ```
   <PUBLIC_URL>/api/v1/auth/discord/callback
   ```

   Examples:
   - Local: `http://localhost:3000/api/v1/auth/discord/callback`
   - Production: `https://modyrn.example.com/api/v1/auth/discord/callback`

   > This must match `PUBLIC_URL` character-for-character (scheme, host, port,
   > path). A mismatch is the single most common cause of a failed login.

## 2. Download the compose file and environment template

```bash
curl -O https://raw.githubusercontent.com/modyrn/modyrn/main/docker/docker-compose.yml
curl -o .env https://raw.githubusercontent.com/modyrn/modyrn/main/.env.example
```

## 3. Configure `.env`

Open `.env`. For a Docker deployment you only need to fill in the **REQUIRED**
section; everything else has safe defaults. Recommended values:

| Variable                | Required | Recommended value                                             |
| ----------------------- | -------- | ------------------------------------------------------------- |
| `PUBLIC_URL`            | ✅       | `https://modyrn.example.com` (prod) · `http://localhost:3000` (dev) |
| `DISCORD_CLIENT_ID`     | ✅       | from the OAuth2 page                                          |
| `DISCORD_CLIENT_SECRET` | ✅       | from the OAuth2 page                                          |
| `DISCORD_TOKEN`         | ✅       | from the Bot page                                             |
| `DISCORD_PUBLIC_KEY`    | ✅       | from General Information                                      |
| `JWT_SECRET`            | ✅       | `openssl rand -hex 32`                                        |
| `ENCRYPTION_KEY`        | ✅       | `openssl rand -hex 32` (must be 64 hex chars)                 |
| `POSTGRES_PASSWORD`     | ➖       | a strong password (defaults to `change-me`)                   |
| `DASHBOARD_PORT`        | ➖       | `3000` (the only published port)                              |
| `MODYRN_VERSION`        | ➖       | `latest`, or pin a version like `0.1.0`                       |
| `LOG_LEVEL`             | ➖       | `info`                                                        |

Generate the two secrets:

```bash
echo "JWT_SECRET=$(openssl rand -hex 32)"
echo "ENCRYPTION_KEY=$(openssl rand -hex 32)"
```

You do **not** need to set `DATABASE_URL`, `REDIS_URL`, or `API_URL` for a
Docker deployment — the compose file wires those up internally. (They only
matter for [local development](./developer-guide.md).)

## 4. (Recommended) Put a reverse proxy in front for HTTPS

Terminate TLS at a reverse proxy and forward everything to the dashboard port.
You do **not** proxy the API separately. Example [Caddy](https://caddyserver.com/)
config:

```caddy
modyrn.example.com {
    reverse_proxy localhost:3000
}
```

Caddy fetches and renews certificates automatically. With this in place set
`PUBLIC_URL=https://modyrn.example.com`.

If you're just trying Modyrn locally, skip this and use
`PUBLIC_URL=http://localhost:3000`.

## 5. Launch

```bash
docker compose up -d
```

This starts the dashboard, API, bot, PostgreSQL and Redis. Database migrations
run automatically when the API starts. Check status with:

```bash
docker compose ps
docker compose logs -f api
```

## 6. Run the setup wizard

Open `PUBLIC_URL` in your browser. The first-run wizard walks you through:

1. Sign in with Discord
2. Select your server
3. Invite/authorize the bot
4. Create a quarantine role
5. Configure logging
6. Enable automod presets

## Upgrading

```bash
docker compose pull
docker compose up -d
```

Migrations are applied automatically on startup. Back up your database first —
see [configuration.md](./configuration.md#backups).

## Troubleshooting

| Symptom                                   | Likely cause & fix                                                                                     |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Login fails / "invalid redirect URI"      | The Discord redirect must equal `<PUBLIC_URL>/api/v1/auth/discord/callback` exactly. Fix it in the portal or `PUBLIC_URL`. |
| Redirected to `http://api:4000` after login | You're on an old build. `API_URL` is internal; the OAuth callback uses `PUBLIC_URL`. Pull the latest images. |
| Cookies don't stick / logged out instantly | `PUBLIC_URL` must match the address in your browser's bar, and be `https://` in production.            |
| Dashboard loads but API calls 502/timeout | The `api` container isn't healthy — check `docker compose logs api` (often a bad `DATABASE_URL`/secret). |
| `ENCRYPTION_KEY` error on startup         | It must be exactly 64 hex characters (32 bytes). Regenerate with `openssl rand -hex 32`.               |

## Accessing the API directly (optional)

The API is intentionally not published. If you want to reach it directly (for
example to view the Swagger docs at `/api/docs` while debugging), uncomment the
`ports` mapping on the `api` service in `docker-compose.yml`.
