# syntax=docker/dockerfile:1.7
# One locked revision → two images: `api` (Hono on Node 24) and `web` (Caddy serving the generated Nuxt app).
FROM node:24-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH CI=1
RUN corepack enable
WORKDIR /repo

FROM base AS build
COPY . .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm catalog \
 && pnpm --filter @countrybox/api build \
 && pnpm --filter @countrybox/web generate \
 && pnpm --filter @countrybox/api deploy --prod --legacy /out/api \
 && cp -r apps/api/dist /out/api/dist

FROM node:24-slim AS api
ENV NODE_ENV=production
RUN apt-get update \
 && apt-get install -y --no-install-recommends curl \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /out/api /app
USER node
EXPOSE 8787
HEALTHCHECK --interval=15s --timeout=3s --start-period=30s --start-interval=2s CMD curl -fsS -o /dev/null http://127.0.0.1:8787/api/health || exit 1
CMD ["node", "dist/server.mjs"]

FROM caddy:2 AS web
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /repo/apps/web/.output/public /srv
