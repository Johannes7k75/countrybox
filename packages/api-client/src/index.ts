import type { ApiType } from '@countrybox/api/rpc'
import { hc } from 'hono/client'

/** Typed client inferred from the Hono route tree. Same-origin; cookies included. */
export const createApiClient = (origin: string) => hc<ApiType>(origin, { init: { credentials: 'same-origin' } })
export type ApiClient = ReturnType<typeof createApiClient>
