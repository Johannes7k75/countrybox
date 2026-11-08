import { afterAll, describe, expect, it } from 'vitest'

import { app } from '../src/app'
import { pool } from '../src/db'

const ORIGIN = process.env.PUBLIC_ORIGIN!
type Jar = { cookie: string }
const newJar = (): Jar => ({ cookie: '' })
async function call(
  jar: Jar | null,
  method: string,
  path: string,
  body?: unknown,
  headers: Record<string, string> = {},
) {
  const res = await app.request(path, {
    method,
    headers: {
      origin: ORIGIN,
      ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
      ...(jar?.cookie ? { cookie: jar.cookie } : {}),
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
  if (jar)
    for (const c of res.headers.getSetCookie()) {
      const [kv] = c.split(';')
      const [k] = kv!.split('=')
      jar.cookie = [...jar.cookie.split('; ').filter((x) => x && !x.startsWith(k + '=')), kv].join('; ')
    }
  const text = await res.text()
  let json: any = null
  try {
    json = JSON.parse(text)
  } catch {
    /* not json */
  }
  return { status: res.status, json, headers: res.headers }
}
const signup = async (jar: Jar) =>
  call(jar, 'POST', '/api/accounts/pseudonymous', { password: 'correct horse battery', name: 'Tester' })
afterAll(async () => {
  await pool.end()
})

describe('health', () => {
  it('liveness and readiness', async () => {
    expect((await call(null, 'GET', '/api/health')).status).toBe(200)
    const r = await call(null, 'GET', '/api/ready')
    expect(r.status).toBe(200)
    expect(r.json.catalogVersion).toMatch(/^[0-9a-f]{16}$/)
  })
  it('unknown api route is JSON 404, responses are no-store', async () => {
    const r = await call(null, 'GET', '/api/nope')
    expect(r.status).toBe(404)
    expect(r.json.error.code).toBe('not_found')
    expect(r.headers.get('cache-control')).toBe('private, no-store')
  })
})

describe('no-email accounts', () => {
  it('creates an account, sets cookies, and signs in from a second browser', async () => {
    const jar = newJar()
    const r = await signup(jar)
    expect(r.status).toBe(201)
    expect(r.json.accountId).toMatch(/^[A-Z2-9]{4}(-[A-Z2-9]{4}){3}$/)
    expect(jar.cookie).toContain('session_token')
    const me = await call(jar, 'GET', '/api/me')
    expect(me.status).toBe(200)
    expect(me.json.email).toBeNull()
    expect(me.json.emailIsReal).toBe(false)
    // second browser: sign in with the ID (case/dash-insensitive after normalisation on the client)
    const other = newJar()
    const login = await call(other, 'POST', '/api/auth/sign-in/username', {
      username: r.json.accountId.replaceAll('-', '').toLowerCase(),
      password: 'correct horse battery',
    })
    expect(login.status).toBe(200)
    expect((await call(other, 'GET', '/api/me')).json.id).toBe(me.json.id)
    // sign out revokes
    await call(other, 'POST', '/api/auth/sign-out', {})
    expect((await call(other, 'GET', '/api/me')).status).toBe(401)
  })
  it('blocks the generic sign-up route and alias emails on the email route', async () => {
    expect(
      (
        await call(newJar(), 'POST', '/api/auth/sign-up/email', {
          email: 'x@example.com',
          password: 'abcdefghijk',
          name: 'x',
        })
      ).status,
    ).toBe(404)
    expect(
      (
        await call(newJar(), 'POST', '/api/accounts/email', {
          email: 'abc@accounts.countrybox.invalid',
          password: 'abcdefghijk',
          name: 'x',
        })
      ).status,
    ).toBe(422)
  })
  it('rejects cross-origin and non-JSON writes', async () => {
    expect(
      (
        await call(
          newJar(),
          'POST',
          '/api/accounts/pseudonymous',
          { password: 'correct horse battery' },
          { origin: 'https://evil.example' },
        )
      ).status,
    ).toBe(403)
    const r = await app.request('/api/accounts/pseudonymous', {
      method: 'POST',
      headers: { origin: ORIGIN, 'content-type': 'text/plain' },
      body: '{}',
    })
    expect(r.status).toBe(422)
  })
  it('validates input with field errors', async () => {
    const r = await call(newJar(), 'POST', '/api/accounts/pseudonymous', { password: 'short' })
    expect(r.status).toBe(422)
    expect(r.json.error.fieldErrors.password).toBeTruthy()
  })
})

describe('settings', () => {
  it('requires auth, rejects ownership fields, and detects stale versions', async () => {
    expect((await call(newJar(), 'GET', '/api/settings')).status).toBe(401)
    const jar = newJar()
    await signup(jar)
    const s0 = await call(jar, 'GET', '/api/settings')
    expect(s0.json.rowVersion).toBe(0)
    expect((await call(jar, 'PATCH', '/api/settings', { rowVersion: 0, userId: 'someone-else' })).status).toBe(422)
    const s1 = await call(jar, 'PATCH', '/api/settings', { rowVersion: 0, locale: 'de', prefs: { theme: 'dark' } })
    expect(s1.status).toBe(200)
    expect(s1.json).toMatchObject({ locale: 'de', rowVersion: 1, prefs: { theme: 'dark' } })
    const stale = await call(jar, 'PATCH', '/api/settings', { rowVersion: 0, locale: 'en' })
    expect(stale.status).toBe(409)
    expect(stale.json.current.rowVersion).toBe(1)
  })
})

describe('reviews', () => {
  it('enroll → queue → present → answer schedules once; retries are idempotent; users are isolated', async () => {
    const jar = newJar()
    await signup(jar)
    const q0 = await call(jar, 'POST', '/api/review/enroll', {
      entityId: 'pt',
      directions: ['flag-name', 'name-capital'],
    })
    expect(q0.status).toBe(200)
    expect(q0.json.due).toHaveLength(2)
    const card = q0.json.due.find((c: any) => c.direction === 'flag-name')
    const pKey = crypto.randomUUID()
    const p = await call(jar, 'POST', '/api/review/presentations', {
      cardId: card.id,
      mapPolicy: 'after',
      idempotencyKey: pKey,
    })
    expect(p.status).toBe(201)
    expect(p.json.optionIds).toHaveLength(4)
    expect(p.json.optionIds).toContain('pt')
    const pAgain = await call(jar, 'POST', '/api/review/presentations', {
      cardId: card.id,
      mapPolicy: 'after',
      idempotencyKey: pKey,
    })
    expect(pAgain.json.id).toBe(p.json.id)
    // another user cannot answer it
    const intruder = newJar()
    await signup(intruder)
    expect(
      (
        await call(intruder, 'POST', '/api/review/answers', {
          presentationId: p.json.id,
          optionId: 'pt',
          idempotencyKey: crypto.randomUUID(),
        })
      ).status,
    ).toBe(404)
    // client cannot inject stage/due
    expect(
      (
        await call(jar, 'POST', '/api/review/answers', {
          presentationId: p.json.id,
          optionId: 'pt',
          idempotencyKey: crypto.randomUUID(),
          stage: 5,
        })
      ).status,
    ).toBe(422)
    const aKey = crypto.randomUUID()
    const a = await call(jar, 'POST', '/api/review/answers', {
      presentationId: p.json.id,
      optionId: 'pt',
      idempotencyKey: aKey,
    })
    expect(a.status).toBe(200)
    expect(a.json).toMatchObject({ correct: true, assisted: false, stageBefore: 0, stageAfter: 1 })
    expect(Date.parse(a.json.dueAt) - Date.now()).toBeGreaterThan(23 * 3600_000)
    const replay = await call(jar, 'POST', '/api/review/answers', {
      presentationId: p.json.id,
      optionId: 'pt',
      idempotencyKey: aKey,
    })
    expect(replay.json).toEqual(a.json)
    expect(
      (
        await call(jar, 'POST', '/api/review/answers', {
          presentationId: p.json.id,
          optionId: 'es',
          idempotencyKey: aKey,
        })
      ).status,
    ).toBe(409)
    const q1 = await call(jar, 'GET', '/api/review/queue')
    expect(q1.json.due).toHaveLength(1)
    expect(q1.json.cards.find((c: any) => c.id === card.id).stage).toBe(1)
    // not-due card cannot be presented
    expect(
      (
        await call(jar, 'POST', '/api/review/presentations', {
          cardId: card.id,
          mapPolicy: 'after',
          idempotencyKey: crypto.randomUUID(),
        })
      ).status,
    ).toBe(409)
  })
  it('pre-answer hint keeps the stage; wrong answer resets to 0', async () => {
    const jar = newJar()
    await signup(jar)
    const q = await call(jar, 'POST', '/api/review/enroll', {
      entityId: 'jp',
      directions: ['flag-name', 'name-capital'],
    })
    const [c1, c2] = q.json.due
    const p1 = await call(jar, 'POST', '/api/review/presentations', {
      cardId: c1.id,
      mapPolicy: 'after',
      idempotencyKey: crypto.randomUUID(),
    })
    await call(jar, 'POST', `/api/review/presentations/${p1.json.id}/hint`, {})
    const a1 = await call(jar, 'POST', '/api/review/answers', {
      presentationId: p1.json.id,
      optionId: 'jp',
      idempotencyKey: crypto.randomUUID(),
    })
    expect(a1.json).toMatchObject({ correct: true, assisted: true, stageAfter: 0 })
    const p2 = await call(jar, 'POST', '/api/review/presentations', {
      cardId: c2.id,
      mapPolicy: 'always',
      idempotencyKey: crypto.randomUUID(),
    })
    const wrong = p2.json.optionIds.find((id: string) => id !== 'jp')
    const a2 = await call(jar, 'POST', '/api/review/answers', {
      presentationId: p2.json.id,
      optionId: wrong,
      idempotencyKey: crypto.randomUUID(),
    })
    expect(a2.json).toMatchObject({ correct: false, stageAfter: 0 })
  })
  it('imports practice history idempotently', async () => {
    const jar = newJar()
    await signup(jar)
    const att = {
      id: crypto.randomUUID(),
      sessionId: crypto.randomUUID(),
      entityId: 'fr',
      direction: 'flag-name',
      firstCorrect: true,
      assisted: false,
      catalogVersion: 'x',
      answeredAt: new Date().toISOString(),
    }
    expect((await call(jar, 'POST', '/api/practice/import', { attempts: [att] })).json.accepted).toEqual([att.id])
    expect((await call(jar, 'POST', '/api/practice/import', { attempts: [att] })).status).toBe(200)
  })
})

describe('account lifecycle', () => {
  it('exports and deletes with a recent session', async () => {
    const jar = newJar()
    await signup(jar)
    const ex = await call(jar, 'POST', '/api/account/export', {})
    expect(ex.status).toBe(200)
    expect(ex.json.account.email).toBeNull()
    const del = await call(jar, 'DELETE', '/api/account')
    expect(del.status).toBe(200)
    expect((await call(jar, 'GET', '/api/me')).status).toBe(401)
    expect((await call(jar, 'DELETE', '/api/account')).status).toBe(401)
  })
})
