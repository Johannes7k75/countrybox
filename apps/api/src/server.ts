import { fileURLToPath } from 'node:url'

import { serve } from '@hono/node-server'

import { app } from './app'
import { pool } from './db'
import { runMigrations } from './db/run-migrations'
import { env } from './env'

// Resolves to src/db/migrations in dev and dist/db/migrations in the build.
await runMigrations(fileURLToPath(new URL('./db/migrations', import.meta.url)))
console.info('migrations applied')

const server = serve({ fetch: app.fetch, port: env.PORT, hostname: '0.0.0.0' }, (i) =>
  console.log(`api listening on :${i.port}`),
)
const shutdown = () => {
  server.close()
  void pool.end().finally(() => process.exit(0))
}
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
