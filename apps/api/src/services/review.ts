import type { AnswerResult, Card, Presentation, Queue } from '@countrybox/contracts'
import {
  REVIEW_DIRECTIONS,
  SCHEDULER_VERSION,
  buildQuestion,
  createRng,
  eligible,
  outcomeOf,
  randomSeed,
  schedule,
  type Direction,
} from '@countrybox/domain'
import { and, asc, eq, sql } from 'drizzle-orm'

import { db, schema } from '../db'
import { byId, catalog } from '../lib/catalog'
import { checkIdempotency, hashBody, storeIdempotency } from '../lib/idempotency'

export class ServiceError extends Error {
  constructor(
    public status: 404 | 409 | 422,
    public code: 'not_found' | 'conflict' | 'invalid_input',
    message: string,
  ) {
    super(message)
  }
}
const DAY = 86_400_000
const toCard = (r: typeof schema.learningCard.$inferSelect): Card => ({
  id: r.id,
  entityId: r.entityId,
  direction: r.direction,
  stage: r.stage,
  dueAt: r.dueAt.toISOString(),
  lapses: r.lapses,
})

export async function enroll(userId: string, entityId: string, directions: string[], now = new Date()) {
  const c = byId.get(entityId)
  if (!c) throw new ServiceError(404, 'not_found', 'Unknown country')
  const valid = directions.filter(
    (d): d is Direction => (REVIEW_DIRECTIONS as string[]).includes(d) && eligible([c], d as Direction).length === 1,
  )
  if (!valid.length) throw new ServiceError(422, 'invalid_input', 'No valid direction for this country')
  await db
    .insert(schema.learningCard)
    .values(
      valid.map((direction) => ({
        userId,
        entityId,
        direction,
        catalogVersion: catalog.version,
        stage: 0,
        dueAt: now,
        schedulerVersion: SCHEDULER_VERSION,
      })),
    )
    .onConflictDoNothing()
  return queue(userId, now)
}

export async function unenroll(userId: string, cardId: string) {
  await db
    .delete(schema.learningCard)
    .where(and(eq(schema.learningCard.id, cardId), eq(schema.learningCard.userId, userId)))
}

/** Read-only: never advances cards. upcoming[i] = cards due in (now+i·24h, now+(i+1)·24h]; [0] includes overdue. */
export async function queue(userId: string, now = new Date()): Promise<Queue> {
  const rows = await db
    .select()
    .from(schema.learningCard)
    .where(eq(schema.learningCard.userId, userId))
    .orderBy(asc(schema.learningCard.dueAt))
  const cards = rows.map(toCard)
  const upcoming = Array.from({ length: 7 }, () => 0)
  for (const r of rows) {
    const i = Math.max(0, Math.ceil((r.dueAt.getTime() - now.getTime()) / DAY) - 1)
    if (r.dueAt <= now) upcoming[0]!++
    else if (i < 7) upcoming[i]!++
  }
  return { now: now.toISOString(), cards, due: cards.filter((c) => Date.parse(c.dueAt) <= now.getTime()), upcoming }
}

export async function present(
  userId: string,
  input: { cardId: string; mapPolicy: string; idempotencyKey: string },
  now = new Date(),
): Promise<Presentation> {
  const reqHash = hashBody({ cardId: input.cardId, mapPolicy: input.mapPolicy })
  return db.transaction(async (tx) => {
    const replay = await checkIdempotency(tx, userId, 'presentation', input.idempotencyKey, reqHash)
    if (replay.kind === 'replay') return replay.response as Presentation
    if (replay.kind === 'mismatch')
      throw new ServiceError(409, 'conflict', 'Idempotency key reused with a different request')
    const [card] = await tx
      .select()
      .from(schema.learningCard)
      .where(and(eq(schema.learningCard.id, input.cardId), eq(schema.learningCard.userId, userId)))
    if (!card) throw new ServiceError(404, 'not_found', 'Card not found')
    if (card.dueAt > now) throw new ServiceError(409, 'conflict', 'Card is not due yet')
    const target = byId.get(card.entityId)
    const direction = card.direction as Direction
    if (!target) throw new ServiceError(409, 'conflict', 'Country no longer in catalog')
    const pool = eligible(catalog.countries, direction)
    const q = buildQuestion(
      target,
      direction,
      pool.filter((c) => c.un),
      pool,
      createRng(randomSeed()),
    )
    if (!q) throw new ServiceError(409, 'conflict', 'No valid question for this card')
    const hint = input.mapPolicy === 'always'
    const [p] = await tx
      .insert(schema.reviewPresentation)
      .values({
        userId,
        cardId: card.id,
        cardRowVersion: card.rowVersion,
        catalogVersion: catalog.version,
        optionIds: q.optionIds,
        mapPolicy: input.mapPolicy,
        hintShownAt: hint ? now : null,
      })
      .returning()
    const out: Presentation = {
      id: p!.id,
      cardId: card.id,
      entityId: card.entityId,
      direction,
      optionIds: q.optionIds,
      hintShown: hint,
    }
    await storeIdempotency(tx, userId, 'presentation', input.idempotencyKey, reqHash, 201, out)
    return out
  })
}

/** Records a pre-answer hint. Repeating returns the same state; after answering it has no effect. */
export async function hint(userId: string, presentationId: string, now = new Date()) {
  const [p] = await db
    .update(schema.reviewPresentation)
    .set({ hintShownAt: sql`coalesce(${schema.reviewPresentation.hintShownAt}, ${now})` })
    .where(
      and(
        eq(schema.reviewPresentation.id, presentationId),
        eq(schema.reviewPresentation.userId, userId),
        sql`${schema.reviewPresentation.answeredAt} is null`,
      ),
    )
    .returning()
  if (!p) throw new ServiceError(404, 'not_found', 'Open presentation not found')
  return { hintShown: true as const }
}

export async function answerReview(
  userId: string,
  input: { presentationId: string; optionId: string; idempotencyKey: string },
  now = new Date(),
): Promise<AnswerResult> {
  const reqHash = hashBody({ presentationId: input.presentationId, optionId: input.optionId })
  return db.transaction(async (tx) => {
    const replay = await checkIdempotency(tx, userId, 'answer', input.idempotencyKey, reqHash)
    if (replay.kind === 'replay') return replay.response as AnswerResult
    if (replay.kind === 'mismatch')
      throw new ServiceError(409, 'conflict', 'Idempotency key reused with a different request')
    const [p] = await tx
      .select()
      .from(schema.reviewPresentation)
      .where(and(eq(schema.reviewPresentation.id, input.presentationId), eq(schema.reviewPresentation.userId, userId)))
      .for('update')
    if (!p) throw new ServiceError(404, 'not_found', 'Presentation not found')
    if (p.answeredAt) throw new ServiceError(409, 'conflict', 'Already answered')
    if (!p.optionIds.includes(input.optionId)) throw new ServiceError(422, 'invalid_input', 'Option not offered')
    const [card] = await tx.select().from(schema.learningCard).where(eq(schema.learningCard.id, p.cardId)).for('update')
    if (!card) throw new ServiceError(404, 'not_found', 'Card not found')
    if (card.rowVersion !== p.cardRowVersion)
      throw new ServiceError(409, 'conflict', 'Card changed since this question was issued')
    const correct = input.optionId === card.entityId
    const assisted = p.hintShownAt !== null
    const res = schedule(card.stage, outcomeOf(correct, assisted), now)
    await tx
      .update(schema.learningCard)
      .set({
        stage: res.stage,
        dueAt: res.dueAt,
        lapses: card.lapses + (res.lapse ? 1 : 0),
        lastReviewedAt: now,
        rowVersion: card.rowVersion + 1,
      })
      .where(eq(schema.learningCard.id, card.id))
    await tx.update(schema.reviewPresentation).set({ answeredAt: now }).where(eq(schema.reviewPresentation.id, p.id))
    await tx.insert(schema.reviewEvent).values({
      userId,
      cardId: card.id,
      presentationId: p.id,
      chosenId: input.optionId,
      correct,
      assisted,
      stageBefore: card.stage,
      stageAfter: res.stage,
      dueBefore: card.dueAt,
      dueAfter: res.dueAt,
      schedulerVersion: SCHEDULER_VERSION,
    })
    const out: AnswerResult = {
      correct,
      assisted,
      targetId: card.entityId,
      stageBefore: card.stage,
      stageAfter: res.stage,
      dueAt: res.dueAt.toISOString(),
    }
    await storeIdempotency(tx, userId, 'answer', input.idempotencyKey, reqHash, 200, out)
    return out
  })
}
