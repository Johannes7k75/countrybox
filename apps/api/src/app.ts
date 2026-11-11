import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { compress } from 'hono/compress'
import { secureHeaders } from 'hono/secure-headers'

import { auth } from './auth'
import { pool } from './db'
import { env } from './env'
import { catalog } from './lib/catalog'
import { fail, loadSession, noStore, requestId, type AppEnv } from './lib/http'
import { mountStatic } from './lib/static'
import { accounts } from './routes/accounts'
import { me } from './routes/me'
import { review } from './routes/review'

/** Typed route tree — `typeof routes` is the frontend contract (Hono RPC). */
export const routes = new Hono<AppEnv>()
  .basePath('/api')
  .get('/health', (c) => c.json({ status: 'ok' as const }, 200))
  .get('/ready', async (c) => {
    try {
      await pool.query('select 1')
      return c.json({ status: 'ready' as const, catalogVersion: catalog.version }, 200)
    } catch {
      return c.json({ status: 'unavailable' as const }, 503)
    }
  })
  .route('/accounts', accounts)
  .route('/', me)
  .route('/', review)

export const app = new Hono<AppEnv>()
app.use(
  '*',
  requestId,
  compress(),
  secureHeaders({
    // Not the default no-referrer: that makes browsers send `Origin: null` on same-origin POSTs, failing the CSRF check.
    referrerPolicy: 'strict-origin-when-cross-origin',
    permissionsPolicy: { camera: false, microphone: false, geolocation: false },
  }),
)
app.use(
  '/api/*',
  bodyLimit({
    maxSize: 256 * 1024,
    onError: (c) => c.json({ error: { code: 'invalid_input', message: 'Body too large' } }, 413),
  }),
)
app.use('/api/*', noStore)
// Generic sign-up bypasses CountryBox account policy; only /api/accounts/* may create accounts.
app.all('/api/auth/sign-up/*', (c) => fail(c, 404, 'not_found', 'Not found'))
app.on(['GET', 'POST'], '/api/auth/*', (c) => auth.handler(c.req.raw))
app.use('/api/*', loadSession)
app.route('/', routes)
if (env.STATIC_DIR) mountStatic(app, env.STATIC_DIR)
app.notFound((c) => fail(c, 404, 'not_found', 'Not found'))
app.onError((err, c) => {
  console.error(
    JSON.stringify({ level: 'error', requestId: c.get('requestId'), path: c.req.path, message: err.message }),
  )
  return fail(c, 500, 'internal', 'Something went wrong')
})
