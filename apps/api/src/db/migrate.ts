import { fileURLToPath } from 'node:url'

// Applies reviewed SQL migrations. Run as a one-off deployment job, never at API boot.
import { migrate } from 'drizzle-orm/node-postgres/migrator'

import { db, pool } from './index'
await migrate(db, { migrationsFolder: fileURLToPath(new URL('./migrations', import.meta.url)) })
await pool.end()
console.log('migrations applied')
