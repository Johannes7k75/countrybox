# CountryBox

A field atlas for learning flags, country names, capitals, internet domains, and calling codes. You can practice in any of the 20 prompt→answer directions as a guest. An optional account (no email needed) syncs settings and schedules spaced reviews with a Leitner box.

## Stack

| Part    | Tech                                                                                              |
| ------- | ------------------------------------------------------------------------------------------------- |
| Web     | Nuxt 4 / Vue, statically generated (`apps/web`)                                                   |
| API     | Hono on Node, typed RPC client (`apps/api`, `packages/api-client`)                                |
| Data    | PostgreSQL 18, Drizzle ORM + SQL migrations                                                       |
| Auth    | Better Auth: generated account ID + password, or email + password                                 |
| Rules   | Pure TypeScript domain package: questions, sessions, scheduler (`packages/domain`)                |
| Catalog | Built from `data/` by `tools/catalog`: 245 countries, CLDR names (EN/DE), flag-icons, world map   |
| Edge    | One container: Hono serves `/api/*` and the static app; TLS via your reverse proxy (e.g. Traefik) |

## Develop

`make help` lists all tasks. Quick start: `make setup && make dev`. The manual steps are:

Requirements: Node ≥ 22, pnpm 11, Docker.

```sh
pnpm install
pnpm catalog                          # generate the catalog (flags, facts, map)
pnpm db:up                            # PostgreSQL 18 on 127.0.0.1:5433
cp apps/api/.env.example apps/api/.env   # set BETTER_AUTH_SECRET (openssl rand -hex 32)
pnpm --filter @countrybox/api db:migrate
pnpm dev:api                          # http://127.0.0.1:8787
pnpm dev:web                          # http://localhost:3000 (proxies /api)
```

## Test

```sh
pnpm -r typecheck
pnpm --filter @countrybox/domain test     # question/session/scheduler rules
pnpm --filter @countrybox/api test        # API integration tests (needs db:up)
cd tests/e2e && BASE_URL=http://localhost:3000 npx playwright test   # browser journeys
```

## Deploy

```sh
cp .env.example .env                    # set PUBLIC_ORIGIN, POSTGRES_PASSWORD, BETTER_AUTH_SECRET
docker compose pull && docker compose up -d   # published images from GHCR (pin with COUNTRYBOX_VERSION)
docker compose up -d --build            # or build from this checkout
```

The stack runs `app` (the Hono server: serves `/api` and the static web app, and applies pending migrations on startup) and PostgreSQL. Put it behind a reverse proxy such as Traefik for TLS; `compose.yml` has an example of the labels. The compose project is called `countrybox-v2` so it never touches the legacy `countrybox` containers on the same host.

## License

Code: MIT. Flags: [flag-icons](https://github.com/lipis/flag-icons) (MIT). Country names: Unicode CLDR.
