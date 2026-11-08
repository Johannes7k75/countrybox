import { serve } from '@hono/node-server'

import { app } from './app'
import { pool } from './db'
import { env } from './env'

const server = serve({ fetch: app.fetch, port: env.PORT, hostname: '0.0.0.0' }, (i) =>
  console.log(`api listening on :${i.port}`),
)
const shutdown = () => {
  server.close()
  void pool.end().finally(() => process.exit(0))
}
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
