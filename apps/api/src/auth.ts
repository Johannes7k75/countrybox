import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { username } from 'better-auth/plugins'

import { db, schema } from './db'
import { env, isProd } from './env'

export const ALIAS_DOMAIN = 'accounts.countrybox.invalid'
export const isAliasEmail = (email: string | null | undefined) => !!email && email.endsWith('@' + ALIAS_DOMAIN)

/**
 * Better Auth, mounted at /api/auth in Hono. Generic sign-up routes are blocked in app.ts;
 * accounts are only created by routes/accounts.ts which enforces CountryBox policy.
 */
export const auth = betterAuth({
  baseURL: env.PUBLIC_ORIGIN,
  basePath: '/api/auth',
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [env.PUBLIC_ORIGIN],
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: { user: schema.user, session: schema.session, account: schema.account, verification: schema.verification },
  }),
  emailAndPassword: { enabled: true, minPasswordLength: 10, maxPasswordLength: 128, autoSignIn: true },
  plugins: [username({ minUsernameLength: 16, maxUsernameLength: 16 })],
  session: { expiresIn: 60 * 60 * 24 * 30, updateAge: 60 * 60 * 24, cookieCache: { enabled: false } },
  rateLimit: { enabled: true, window: 60, max: 30 },
  advanced: {
    useSecureCookies: isProd,
    ipAddress: { ipAddressHeaders: env.TRUST_PROXY === '1' ? ['x-forwarded-for'] : [] },
  },
  telemetry: { enabled: false },
})
