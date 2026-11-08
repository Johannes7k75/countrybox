import type { ApiError } from '@countrybox/contracts'
import type { Context, MiddlewareHandler } from 'hono'
import { createMiddleware } from 'hono/factory'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

import { auth } from '../auth'
import { env } from '../env'

export type SessionUser = typeof auth.$Infer.Session.user
export type SessionInfo = typeof auth.$Infer.Session.session
export type AppEnv = { Variables: { requestId: string; user: SessionUser | null; session: SessionInfo | null } }

type Code = ApiError['error']['code']
/** Consistent error body `{ error: { code, message, fieldErrors?, requestId } }`. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- also used from validator hooks with a generic Env
export function fail<S extends ContentfulStatusCode>(
  c: Context,
  status: S,
  code: Code,
  message: string,
  fieldErrors?: Record<string, string[]>,
) {
  return c.json(
    {
      error: { code, message, requestId: c.get('requestId') as string, ...(fieldErrors ? { fieldErrors } : {}) },
    } satisfies ApiError,
    status,
  )
}

export const requestId: MiddlewareHandler<AppEnv> = async (c, next) => {
  const id = crypto.randomUUID()
  c.set('requestId', id)
  await next()
  c.header('X-Request-Id', id)
}

/** Per-request session lookup (no cookie cache). */
export const loadSession: MiddlewareHandler<AppEnv> = async (c, next) => {
  const s = await auth.api.getSession({ headers: c.req.raw.headers })
  c.set('user', s?.user ?? null)
  c.set('session', s?.session ?? null)
  await next()
}

/** Authenticated responses are never cached. */
export const noStore: MiddlewareHandler<AppEnv> = async (c, next) => {
  await next()
  c.header('Cache-Control', 'private, no-store')
}

/**
 * CSRF defence for state-changing custom endpoints: same-origin Origin header (or Sec-Fetch-Site), JSON only.
 * Better Auth's own routes use its trustedOrigins check.
 */
export const sameOriginJson: MiddlewareHandler<AppEnv> = async (c, next) => {
  if (c.req.method === 'GET' || c.req.method === 'HEAD') return next()
  const origin = c.req.header('origin')
  const site = c.req.header('sec-fetch-site')
  if (origin ? origin !== env.PUBLIC_ORIGIN : site !== undefined && site !== 'same-origin')
    return fail(c, 403, 'forbidden', 'Cross-origin request rejected')
  if (!origin && site === undefined) return fail(c, 403, 'forbidden', 'Missing origin')
  const ct = c.req.header('content-type') ?? ''
  if (c.req.method !== 'DELETE' && !ct.startsWith('application/json'))
    return fail(c, 422, 'invalid_input', 'Expected application/json')
  return next()
}

export function clientIp(c: Context): string {
  if (env.TRUST_PROXY === '1') {
    const f = c.req.header('x-forwarded-for')
    if (f) return f.split(',')[0]!.trim()
  }
  const incoming = (c.env as { incoming?: { socket?: { remoteAddress?: string } } } | undefined)?.incoming
  return incoming?.socket?.remoteAddress ?? 'unknown'
}

/** Small in-memory fixed-window limiter (single API process). */
export function rateLimit(
  name: string,
  max: number,
  windowMs: number,
  key: (c: Context<AppEnv>) => string = clientIp,
): MiddlewareHandler<AppEnv> {
  const hits = new Map<string, { n: number; reset: number }>()
  return createMiddleware<AppEnv>(async (c, next) => {
    const k = `${name}:${key(c)}`,
      now = Date.now()
    const h = hits.get(k)
    if (!h || h.reset < now) hits.set(k, { n: 1, reset: now + windowMs })
    else if (++h.n > max) {
      c.header('Retry-After', String(Math.ceil((h.reset - now) / 1000)))
      return fail(c, 429, 'rate_limited', 'Too many requests')
    }
    if (hits.size > 10_000) for (const [kk, v] of hits) if (v.reset < now) hits.delete(kk)
    return next()
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const zodFail = (
  result: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } },
  c: Context,
) => {
  if (result.success) return undefined
  const fieldErrors: Record<string, string[]> = {}
  for (const i of result.error?.issues ?? []) (fieldErrors[i.path.join('.') || '_'] ??= []).push(i.message)
  return fail(c, 422, 'invalid_input', 'Invalid input', fieldErrors)
}
