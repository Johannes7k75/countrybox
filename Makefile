# CountryBox v2 — common tasks. Run `make` or `make help` for the list.
# Note: the production compose project is "countrybox-v2" on purpose — "countrybox" belongs to the legacy MySQL stack.

SHELL := /bin/bash
.DEFAULT_GOAL := help

PROD_COMPOSE := docker compose
DEV_COMPOSE  := docker compose -f compose.dev.yml
BASE_URL     ?= http://localhost:3000
CHROMIUM     ?= $(shell command -v chromium 2>/dev/null)

.PHONY: help
help: ## Show this help
	@awk 'BEGIN {FS = ":.*## "} /^[a-zA-Z0-9_-]+:.*## / {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

## ── Setup ──────────────────────────────────────────────
.PHONY: install catalog similarity embeddings setup
install: ## Install workspace dependencies
	pnpm install

catalog: ## Build the country catalog (facts, flags, world map) and the flag neighbour pack
	pnpm catalog

similarity: ## Rebuild only the visual flag neighbour pack + evaluation report (data/similarity)
	pnpm --filter @countrybox/similarity-tool build
	pnpm --filter @countrybox/similarity-tool test

apps/api/.env:
	cp apps/api/.env.example apps/api/.env
	sed -i "s/^BETTER_AUTH_SECRET=.*/BETTER_AUTH_SECRET=$$(openssl rand -hex 32)/" apps/api/.env
	@echo "created apps/api/.env"

setup: install catalog apps/api/.env db-up migrate ## First-time setup: deps, catalog, env, database, migrations

embeddings: ## Recompute the OpenCLIP flag pack with uv (needed after catalog/flag changes; see tools/similarity/EMBEDDINGS.md)
	pnpm --filter @countrybox/similarity-tool export-png
	cd tools/similarity && uv run embed.py clip
	pnpm --filter @countrybox/similarity-tool evaluate ../../data/similarity/flag-neighbors.openclip-vitb32-laion2b-v1.json || true
	$(MAKE) similarity

## ── Development ────────────────────────────────────────
.PHONY: dev dev-api dev-web
dev: ## Run API and web dev servers together (Ctrl+C stops both)
	@trap 'kill 0' INT TERM EXIT; \
	pnpm --filter @countrybox/api dev & \
	pnpm --filter @countrybox/web dev & \
	wait

dev-api: ## Run only the API dev server (http://127.0.0.1:8787)
	pnpm --filter @countrybox/api dev

dev-web: ## Run only the web dev server (http://localhost:3000)
	pnpm --filter @countrybox/web dev

## ── Database (dev) ─────────────────────────────────────
.PHONY: db-up db-down db-psql db-generate migrate
db-up: ## Start the dev PostgreSQL 18 (127.0.0.1:5433)
	$(DEV_COMPOSE) up -d --wait db

db-down: ## Stop the dev PostgreSQL (data volume is kept)
	$(DEV_COMPOSE) down

db-psql: ## Open psql on the dev database
	$(DEV_COMPOSE) exec db psql -U countrybox countrybox

db-generate: ## Generate a SQL migration from schema changes (review it before committing!)
	pnpm --filter @countrybox/api db:generate

migrate: ## Apply migrations to the dev database
	pnpm --filter @countrybox/api db:migrate

## ── Quality ────────────────────────────────────────────
.PHONY: lint lint-fix format format-check typecheck test test-domain test-similarity test-web test-api e2e check
lint: ## Lint with oxlint (type-aware)
	pnpm lint

lint-fix: ## Lint and apply safe autofixes
	pnpm lint:fix

format: ## Format everything with oxfmt
	pnpm format

format-check: ## Fail if any file is not formatted
	pnpm format:check

typecheck: ## Type-check every package
	pnpm -r typecheck

test-domain: ## Domain rule tests (questions, sessions, scheduler)
	pnpm --filter @countrybox/domain test

test-api: db-up ## API integration tests against the dev database
	pnpm --filter @countrybox/api test

test-similarity: ## Neighbour pack sanity + look-alike fixtures
	pnpm --filter @countrybox/similarity-tool test

test-web: ## Web unit tests (i18n message catalogue integrity)
	pnpm --filter @countrybox/web test

test: test-domain test-similarity test-web test-api ## Unit + integration tests

e2e: ## Browser journeys (BASE_URL=http://localhost:3000 by default; needs running app)
	cd tests/e2e && BASE_URL=$(BASE_URL) $(if $(CHROMIUM),CHROMIUM_PATH=$(CHROMIUM)) npx playwright test

check: format-check lint typecheck test ## Everything that runs without a browser

## ── Build & production stack ───────────────────────────
.PHONY: build .env prod-up prod-down prod-logs prod-ps prod-e2e
build: catalog ## Build API bundle and static web app locally
	pnpm --filter @countrybox/api build
	pnpm --filter @countrybox/web generate

.env:
	@test -f .env || { cp .env.example .env; \
	  sed -i "s/^POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$$(openssl rand -hex 12)/; s/^BETTER_AUTH_SECRET=.*/BETTER_AUTH_SECRET=$$(openssl rand -hex 32)/" .env; \
	  echo "created .env — review PUBLIC_ORIGIN/SITE_ADDRESS"; }

prod-up: .env ## Build and start the production stack (http://localhost:8088)
	$(PROD_COMPOSE) up -d --build

prod-down: ## Stop the production stack (volumes are kept)
	$(PROD_COMPOSE) down

prod-logs: ## Follow production logs
	$(PROD_COMPOSE) logs -f --tail=100

prod-ps: ## Show production containers
	$(PROD_COMPOSE) ps -a

prod-e2e: ## Run browser journeys against the production stack
	$(MAKE) e2e BASE_URL=http://localhost:8088

## ── Housekeeping ───────────────────────────────────────
.PHONY: clean
clean: ## Remove build output and generated catalog (keeps node_modules and databases)
	rm -rf apps/api/dist apps/web/.output apps/web/.nuxt apps/web/public/catalog packages/catalog/generated
