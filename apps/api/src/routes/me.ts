import { SettingsPatchSchema, type Me, type Settings } from '@countrybox/contracts'
import { zValidator } from '@hono/zod-validator'
import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'

import { auth, isAliasEmail } from '../auth'
import { db, schema } from '../db'
import { fail, sameOriginJson, zodFail, type AppEnv } from '../lib/http'
import { formatAccountId } from './accounts'

const REAUTH_MS = 15 * 60 * 1000

async function readSettings(userId: string): Promise<Settings> {
  const [row] = await db.select().from(schema.userSettings).where(eq(schema.userSettings.userId, userId))
  if (row)
    return {
      locale: row.locale as Settings['locale'],
      prefs: row.prefs,
      rowVersion: row.rowVersion,
    }
  return { locale: 'en', prefs: {}, rowVersion: 0 }
}

export const me = new Hono<AppEnv>()
  .use('/settings', sameOriginJson)
  .use('/account/*', sameOriginJson)
  .use('/account', sameOriginJson)
  .get('/me', (c) => {
    const u = c.get('user')
    if (!u) return fail(c, 401, 'unauthenticated', 'Sign in required')
    const body: Me = {
      id: u.id,
      name: u.name,
      username: u.username ? formatAccountId(u.username) : null,
      email: isAliasEmail(u.email) ? null : u.email,
      emailIsReal: !isAliasEmail(u.email),
      createdAt: u.createdAt.toISOString(),
    }
    return c.json(body, 200)
  })
  .get('/settings', async (c) => {
    const u = c.get('user')
    if (!u) return fail(c, 401, 'unauthenticated', 'Sign in required')
    return c.json(await readSettings(u.id), 200)
  })
  /** Optimistic concurrency: the client sends the rowVersion it last saw; a stale version gets 409 with the current state. */
  .patch('/settings', zValidator('json', SettingsPatchSchema, zodFail), async (c) => {
    const u = c.get('user')
    if (!u) return fail(c, 401, 'unauthenticated', 'Sign in required')
    const body = c.req.valid('json')
    const cur = await readSettings(u.id)
    if (cur.rowVersion !== body.rowVersion)
      return c.json(
        {
          error: { code: 'conflict' as const, message: 'Settings changed elsewhere', requestId: c.get('requestId') },
          current: cur,
        },
        409,
      )
    const next = { locale: body.locale ?? cur.locale, prefs: { ...cur.prefs, ...body.prefs } }
    if (cur.rowVersion === 0) {
      const ins = await db
        .insert(schema.userSettings)
        .values({ userId: u.id, ...next, rowVersion: 1 })
        .onConflictDoNothing()
        .returning()
      if (!ins.length)
        return c.json(
          {
            error: { code: 'conflict' as const, message: 'Settings changed elsewhere', requestId: c.get('requestId') },
            current: await readSettings(u.id),
          },
          409,
        )
    } else {
      const up = await db
        .update(schema.userSettings)
        .set({ ...next, rowVersion: cur.rowVersion + 1, updatedAt: new Date() })
        .where(and(eq(schema.userSettings.userId, u.id), eq(schema.userSettings.rowVersion, cur.rowVersion)))
        .returning()
      if (!up.length)
        return c.json(
          {
            error: { code: 'conflict' as const, message: 'Settings changed elsewhere', requestId: c.get('requestId') },
            current: await readSettings(u.id),
          },
          409,
        )
    }
    return c.json(await readSettings(u.id), 200)
  })
  /** Personal-data export. Requires a session created in the last 15 minutes. */
  .post('/account/export', async (c) => {
    const u = c.get('user'),
      s = c.get('session')
    if (!u || !s) return fail(c, 401, 'unauthenticated', 'Sign in required')
    if (Date.now() - s.createdAt.getTime() > REAUTH_MS)
      return fail(c, 403, 'reauth_required', 'Please sign in again to export your data')
    const [settings, cards, events, attempts] = await Promise.all([
      readSettings(u.id),
      db.select().from(schema.learningCard).where(eq(schema.learningCard.userId, u.id)),
      db.select().from(schema.reviewEvent).where(eq(schema.reviewEvent.userId, u.id)),
      db.select().from(schema.practiceAttempt).where(eq(schema.practiceAttempt.userId, u.id)),
    ])
    return c.json(
      {
        exportedAt: new Date().toISOString(),
        account: {
          id: u.id,
          name: u.name,
          username: u.username,
          email: isAliasEmail(u.email) ? null : u.email,
          createdAt: u.createdAt.toISOString(),
        },
        settings,
        cards,
        reviewEvents: events,
        practiceAttempts: attempts,
      },
      200,
    )
  })
  /** Deletes all personal rows (FK cascade) and revokes sessions. Repeating cannot recreate data. */
  .delete('/account', async (c) => {
    const u = c.get('user'),
      s = c.get('session')
    if (!u || !s) return fail(c, 401, 'unauthenticated', 'Sign in required')
    if (Date.now() - s.createdAt.getTime() > REAUTH_MS)
      return fail(c, 403, 'reauth_required', 'Please sign in again to delete your account')
    // Sign out first to obtain the cookie-expiring headers, then delete (sessions cascade with the user).
    const out = await auth.api.signOut({ headers: c.req.raw.headers, asResponse: true }).catch(() => null)
    await db.delete(schema.user).where(eq(schema.user.id, u.id))
    const res = c.json({ deleted: true as const }, 200)
    for (const cookie of out?.headers.getSetCookie() ?? []) res.headers.append('Set-Cookie', cookie)
    return res
  })
