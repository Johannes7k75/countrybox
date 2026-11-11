import { createHash } from 'node:crypto'

import { and, eq } from 'drizzle-orm'

import { schema, type Tx } from '../db'

export const hashBody = (body: unknown) => createHash('sha256').update(JSON.stringify(body)).digest('hex')

export type Replay = { kind: 'replay'; status: number; response: unknown } | { kind: 'mismatch' } | { kind: 'new' }

/** Same key + same body → stored response; same key + different body → conflict. Call inside the transaction. */
export async function checkIdempotency(
  tx: Tx,
  userId: string,
  endpoint: string,
  key: string,
  requestHash: string,
): Promise<Replay> {
  const [row] = await tx
    .select()
    .from(schema.idempotencyRecord)
    .where(
      and(
        eq(schema.idempotencyRecord.userId, userId),
        eq(schema.idempotencyRecord.endpoint, endpoint),
        eq(schema.idempotencyRecord.key, key),
      ),
    )
  if (!row) return { kind: 'new' }
  return row.requestHash === requestHash
    ? { kind: 'replay', status: row.status, response: row.response }
    : { kind: 'mismatch' }
}
export async function storeIdempotency(
  tx: Tx,
  userId: string,
  endpoint: string,
  key: string,
  requestHash: string,
  status: number,
  response: unknown,
) {
  await tx.insert(schema.idempotencyRecord).values({ userId, endpoint, key, requestHash, status, response: response })
}
