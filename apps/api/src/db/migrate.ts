import { fileURLToPath } from 'node:url'

// Applies migrations without starting the API (the server also runs them on boot).
import { pool } from './index'
import { runMigrations } from './run-migrations'

await runMigrations(fileURLToPath(new URL('./migrations', import.meta.url)))
await pool.end()
console.log('migrations applied')
