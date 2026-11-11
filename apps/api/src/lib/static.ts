import { serveStatic } from '@hono/node-server/serve-static'
import type { Context, Hono } from 'hono'

import type { AppEnv } from './http'

const cacheFor = (value: string) => (_path: string, c: Context) => c.header('Cache-Control', value)
const noCacheHtml = (path: string, c: Context) => {
  if (path.endsWith('.html')) c.header('Cache-Control', 'no-cache')
}

/**
 * Serves the generated Nuxt app from `root` (production; in dev the Nuxt dev server proxies /api instead).
 * Mounted after the /api routes, so unknown /api paths still get JSON 404s from `app.notFound`.
 */
export function mountStatic(app: Hono<AppEnv>, root: string): void {
  // Hashed build assets and the catalog: the file or a 404, never the SPA shell.
  app.get('/_nuxt/*', serveStatic({ root, onFound: cacheFor('public, max-age=31536000, immutable') }), (c) =>
    c.notFound(),
  )
  app.get('/catalog/*', serveStatic({ root, onFound: cacheFor('public, max-age=3600, must-revalidate') }), (c) =>
    c.notFound(),
  )

  // Everything else outside /api: the file if it exists, otherwise the SPA shell for client-side routing.
  app.get(
    '*',
    (c, next) => (c.req.path === '/api' || c.req.path.startsWith('/api/') ? c.notFound() : next()),
    serveStatic({ root, onFound: noCacheHtml }),
    serveStatic({ root, path: 'index.html', onFound: noCacheHtml }),
  )
}
