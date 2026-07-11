# syntax=docker/dockerfile:1
# ---------------------------------------------------------------------------
# Modyrn API (NestJS) — multi-stage, multi-arch build
# ---------------------------------------------------------------------------

FROM node:20-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
# Pin pnpm to the version the repo declares so builds don't pick up an
# incompatible pnpm@latest before any package.json is present.
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /app

# --- Prune the monorepo to just what the API needs --------------------------
FROM base AS pruner
RUN pnpm add -g turbo@^2
COPY . .
RUN turbo prune @modyrn/api --docker

# --- Install dependencies & build -------------------------------------------
FROM base AS builder
COPY --from=pruner /app/out/json/ .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
RUN pnpm turbo run build --filter=@modyrn/api
RUN pnpm --filter=@modyrn/api --prod deploy /app/deploy

# --- Runtime ----------------------------------------------------------------
FROM node:20-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app
RUN addgroup --system --gid 1001 modyrn \
  && adduser --system --uid 1001 modyrn
COPY --from=builder --chown=modyrn:modyrn /app/deploy .
USER modyrn
EXPOSE 4000
ARG APP_VERSION=dev
ENV APP_VERSION=$APP_VERSION
CMD ["node", "dist/main.js"]
