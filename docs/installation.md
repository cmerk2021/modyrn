# Installation

Modyrn is designed to be self-hosted with Docker. Production installs should
never require building from source.

## Prerequisites

- A host with Docker and the Docker Compose plugin
- A Discord application (bot token + OAuth credentials)

## 1. Create a Discord application

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2. Create a **New Application**.
3. Under **Bot**, add a bot and copy the **token**.
4. Enable the **Server Members Intent** and **Message Content Intent**.
5. Under **OAuth2**, copy the **Client ID** and **Client Secret**.
6. Add a redirect URL: `https://your-domain/api/auth/discord/callback`.

## 2. Configure the environment

```bash
curl -O https://raw.githubusercontent.com/modyrn/modyrn/main/docker/docker-compose.yml
curl -o .env https://raw.githubusercontent.com/modyrn/modyrn/main/.env.example
```

Edit `.env` and set at least:

| Variable                | Description                          |
| ----------------------- | ------------------------------------ |
| `DISCORD_CLIENT_ID`     | OAuth client ID                      |
| `DISCORD_CLIENT_SECRET` | OAuth client secret                  |
| `DISCORD_TOKEN`         | Bot token                            |
| `DISCORD_PUBLIC_KEY`    | Application public key               |
| `PUBLIC_URL`            | Public URL of your dashboard         |
| `JWT_SECRET`            | Random 32+ byte secret               |
| `ENCRYPTION_KEY`        | 32-byte hex key for secret storage   |

Generate secrets:

```bash
openssl rand -hex 32   # JWT_SECRET
openssl rand -hex 32   # ENCRYPTION_KEY
```

## 3. Launch

```bash
docker compose up -d
```

This starts the dashboard, API, bot, PostgreSQL and Redis. Database migrations
run automatically on API startup.

## 4. Run the setup wizard

Open `PUBLIC_URL` in your browser. The first-run wizard walks you through:

1. Discord OAuth sign-in
2. Selecting your server
3. Authorizing the bot
4. Creating a quarantine role
5. Configuring logging
6. Enabling automod presets

## Upgrading

```bash
docker compose pull
docker compose up -d
```

Migrations are applied automatically. Back up your database first — see
[configuration.md](./configuration.md#backups).

## Reverse proxy

Put Modyrn behind a TLS-terminating reverse proxy (Caddy, Traefik, Nginx). Only
the dashboard and API ports need to be exposed. Example Caddyfile snippets are in
[configuration.md](./configuration.md#reverse-proxy).
