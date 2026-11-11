import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'

import { pool } from './index'

// Arbitrary constant; any instance holding this lock is the one applying migrations.
const MIGRATION_LOCK_ID = 727_001

/**
 * Applies pending SQL migrations. Safe to call from several instances at once:
 * a Postgres advisory lock serialises them, and already-applied migrations are skipped.
 */
export async function runMigrations(migrationsFolder: string): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query('SELECT pg_advisory_lock($1)', [MIGRATION_LOCK_ID])
    try {
      await migrate(drizzle(client), { migrationsFolder })
    } finally {
      await client.query('SELECT pg_advisory_unlock($1)', [MIGRATION_LOCK_ID])
    }
  } finally {
    client.release()
  }
}
