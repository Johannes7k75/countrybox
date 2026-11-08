import { EmailSignupSchema, PseudonymousSignupSchema } from '@countrybox/contracts'
import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'

import { ALIAS_DOMAIN, auth } from '../auth'
import { fail, rateLimit, sameOriginJson, zodFail, type AppEnv } from '../lib/http'

const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789' // no 0/o/1/l/i
export function generateAccountId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('')
}
export const formatAccountId = (id: string) =>
  id
    .toUpperCase()
    .match(/.{1,4}/g)!
    .join('-')

/** Forward every Set-Cookie header from Better Auth's internal response. */
function withCookies<R extends Response>(from: Response, to: R): R {
  for (const cookie of from.headers.getSetCookie()) to.headers.append('Set-Cookie', cookie)
  return to
}

export const accounts = new Hono<AppEnv>()
  .use('*', sameOriginJson, rateLimit('signup', 10, 60 * 60 * 1000))
  /** No-email account: generated ID + password. The alias address is never mailed or shown. */
  .post('/pseudonymous', zValidator('json', PseudonymousSignupSchema, zodFail), async (c) => {
    const body = c.req.valid('json')
    for (let attempt = 0; attempt < 3; attempt++) {
      const id = generateAccountId()
      try {
        const res = await auth.api.signUpEmail({
          body: {
            email: `${id}@${ALIAS_DOMAIN}`,
            password: body.password,
            name: body.name ?? 'Explorer',
            username: id,
            rememberMe: body.rememberMe ?? true,
          },
          headers: c.req.raw.headers,
          asResponse: true,
        })
        if (res.status === 422 || res.status === 400) {
          const t = await res.text()
          if (/USERNAME_IS_ALREADY_TAKEN|already exists/i.test(t)) continue
          return fail(c, 422, 'invalid_input', 'Could not create account')
        }
        if (!res.ok) return fail(c, 500, 'internal', 'Could not create account')
        return withCookies(res, c.json({ accountId: formatAccountId(id) }, 201))
      } catch (e) {
        if (/already|taken/i.test(String(e))) continue
        throw e
      }
    }
    return fail(c, 409, 'conflict', 'Please try again')
  })
  /** Real-email account. Verification mail is a pending gate (no mail transport yet); email is stored unverified. */
  .post('/email', zValidator('json', EmailSignupSchema, zodFail), async (c) => {
    const body = c.req.valid('json')
    if (body.email.toLowerCase().endsWith('@' + ALIAS_DOMAIN))
      return fail(c, 422, 'invalid_input', 'Invalid email', { email: ['Invalid email'] })
    const res = await auth.api.signUpEmail({
      body: { email: body.email, password: body.password, name: body.name },
      headers: c.req.raw.headers,
      asResponse: true,
    })
    // Non-enumerating: an existing address gets the same generic failure as other problems.
    if (!res.ok) return fail(c, 422, 'invalid_input', 'Could not create account with these details')
    return withCookies(res, c.json({ ok: true as const }, 201))
  })
