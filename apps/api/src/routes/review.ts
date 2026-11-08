import { AnswerRequestSchema, EnrollSchema, ImportBatchSchema, PresentationRequestSchema } from '@countrybox/contracts'
import { zValidator } from '@hono/zod-validator'
import { Hono, type MiddlewareHandler } from 'hono'
import { z } from 'zod'

import { db, schema } from '../db'
import { fail, sameOriginJson, zodFail, type AppEnv } from '../lib/http'
import { ServiceError, answerReview, enroll, hint, present, queue, unenroll } from '../services/review'

const requireUser: MiddlewareHandler<AppEnv> = async (c, next) =>
  c.get('user') ? next() : fail(c, 401, 'unauthenticated', 'Sign in required')
const Id = z.object({ id: z.string().uuid() })
function handle(c: Parameters<typeof fail>[0], e: unknown) {
  if (e instanceof ServiceError) return fail(c, e.status, e.code, e.message)
  throw e
}

export const review = new Hono<AppEnv>()
  .use('/review/*', sameOriginJson, requireUser)
  .use('/practice/*', sameOriginJson, requireUser)
  .get('/review/queue', async (c) => c.json(await queue(c.get('user')!.id), 200))
  .post('/review/enroll', zValidator('json', EnrollSchema, zodFail), async (c) => {
    const b = c.req.valid('json')
    try {
      return c.json(await enroll(c.get('user')!.id, b.entityId, b.directions), 200)
    } catch (e) {
      return handle(c, e)
    }
  })
  .delete('/review/cards/:id', zValidator('param', Id, zodFail), async (c) => {
    await unenroll(c.get('user')!.id, c.req.valid('param').id)
    return c.json({ ok: true as const }, 200)
  })
  .post('/review/presentations', zValidator('json', PresentationRequestSchema, zodFail), async (c) => {
    try {
      return c.json(await present(c.get('user')!.id, c.req.valid('json')), 201)
    } catch (e) {
      return handle(c, e)
    }
  })
  .post('/review/presentations/:id/hint', zValidator('param', Id, zodFail), async (c) => {
    try {
      return c.json(await hint(c.get('user')!.id, c.req.valid('param').id), 200)
    } catch (e) {
      return handle(c, e)
    }
  })
  .post('/review/answers', zValidator('json', AnswerRequestSchema, zodFail), async (c) => {
    try {
      return c.json(await answerReview(c.get('user')!.id, c.req.valid('json')), 200)
    } catch (e) {
      return handle(c, e)
    }
  })
  /** Bounded import of local practice history: accepted = newly stored or already present. */
  .post('/practice/import', zValidator('json', ImportBatchSchema, zodFail), async (c) => {
    const userId = c.get('user')!.id
    const { attempts } = c.req.valid('json')
    await db
      .insert(schema.practiceAttempt)
      .values(attempts.map((a) => ({ ...a, userId, answeredAt: new Date(a.answeredAt) })))
      .onConflictDoNothing()
    return c.json({ accepted: attempts.map((a) => a.id) }, 200)
  })
