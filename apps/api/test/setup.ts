import { existsSync } from 'node:fs'
// Integration tests need a real PostgreSQL (pnpm db:up) and apps/api/.env
if (existsSync('.env')) process.loadEnvFile('.env')
