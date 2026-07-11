# syntax=docker/dockerfile:1
# ---------------------------------------------------------------------------
# Modyrn Dashboard (Next.js) — multi-stage, multi-arch build
# Uses Next.js standalone output.
# ---------------------------------------------------------------------------

FROM node:20-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

FROM base AS pruner
RUN pnpm add -g turbo@^2
COPY . .
RUN turbo prune @modyrn/dashboard --docker

FROM base AS builder
COPY --from=pruner /app/out/json/ .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm turbo run build --filter=@modyrn/dashboard

FROM node:20-alpine AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
RUN addgroup --system --gid 1001 modyrn \
  && adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:modyrn /app/apps/dashboard/.next/standalone ./
COPY --from=builder --chown=nextjs:modyrn /app/apps/dashboard/.next/static ./apps/dashboard/.next/static
COPY --from=builder --chown=nextjs:modyrn /app/apps/dashboard/public ./apps/dashboard/public
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ARG APP_VERSION=dev
ENV APP_VERSION=$APP_VERSION
CMD ["node", "apps/dashboard/server.js"]
