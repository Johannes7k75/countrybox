import { z } from 'zod'
/** Boot configuration is validated once; the process refuses to start with bad config. */
const Env = z.object({
  DATABASE_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  PUBLIC_ORIGIN: z.string().url(),
  PORT: z.coerce.number().int().positive().default(8787),
  TRUST_PROXY: z.enum(['0', '1']).default('0'),
  NODE_ENV: z.string().default('development'),
})
export const env = Env.parse(process.env)
export const isProd = env.NODE_ENV === 'production'
