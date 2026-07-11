# API Reference

The Modyrn API is a NestJS application exposing a versioned REST API under
`/api/v1` plus a WebSocket gateway for realtime updates. Interactive OpenAPI docs
are served at `/api/docs` when the API is running.

> This document is a high-level map. The authoritative, always-current reference
> is the OpenAPI schema generated at runtime.

## Authentication

Modyrn uses Discord OAuth2. The dashboard performs the browser flow; the API
issues a signed session (JWT) stored in an httpOnly cookie.

| Method | Path                              | Description                     |
| ------ | --------------------------------- | ------------------------------- |
| GET    | `/api/v1/auth/discord`            | Begin the OAuth2 flow           |
| GET    | `/api/v1/auth/discord/callback`   | OAuth2 redirect handler         |
| POST   | `/api/v1/auth/logout`             | Invalidate the current session  |
| GET    | `/api/v1/auth/me`                 | Current user + guild access     |

All other endpoints require an authenticated session and are authorized against
the **dashboard permission model** (independent from Discord permissions).

## Health

| Method | Path              | Description                               |
| ------ | ----------------- | ----------------------------------------- |
| GET    | `/api/v1/health`  | Liveness + dependency status (db, redis)  |
| GET    | `/api/v1/health/ready` | Readiness probe                      |

## Guilds

| Method | Path                          | Description                    |
| ------ | ----------------------------- | ------------------------------ |
| GET    | `/api/v1/guilds`              | Guilds the user can manage     |
| GET    | `/api/v1/guilds/:id`          | Guild overview & settings      |
| PATCH  | `/api/v1/guilds/:id/settings` | Update guild settings          |

## Members

| Method | Path                                   | Description               |
| ------ | -------------------------------------- | ------------------------- |
| GET    | `/api/v1/guilds/:id/members`           | Search & filter members   |
| GET    | `/api/v1/guilds/:id/members/:userId`   | Full member profile       |
| POST   | `/api/v1/guilds/:id/members/:userId/notes` | Add a moderator note  |

## Moderation

Every moderation action creates a **case**.

| Method | Path                                 | Description             |
| ------ | ------------------------------------ | ----------------------- |
| GET    | `/api/v1/guilds/:id/cases`           | List / search cases     |
| GET    | `/api/v1/guilds/:id/cases/:caseId`   | Case detail             |
| POST   | `/api/v1/guilds/:id/actions/warn`    | Warn a member           |
| POST   | `/api/v1/guilds/:id/actions/timeout` | Timeout a member        |
| POST   | `/api/v1/guilds/:id/actions/kick`    | Kick a member           |
| POST   | `/api/v1/guilds/:id/actions/ban`     | Ban a member            |
| POST   | `/api/v1/guilds/:id/actions/quarantine` | Quarantine a member  |

## Realtime

Connect to the WebSocket gateway at `/api/v1/realtime`. After authenticating,
subscribe to a guild channel to receive live events: new cases, automod hits,
member changes, gateway/latency metrics.

## Errors

Errors use a consistent envelope:

```json
{
  "statusCode": 403,
  "error": "Forbidden",
  "message": "Missing dashboard permission: manage_automod",
  "code": "PERMISSION_DENIED"
}
```

## Rate limiting

All endpoints are rate limited per session and per IP. Limits are returned via
`X-RateLimit-*` headers.
