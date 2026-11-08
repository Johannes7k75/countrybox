import { createApiClient, type ApiClient } from '@countrybox/api-client'
import { usernameClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/vue'

let api: ApiClient | null = null
let authClient: ReturnType<typeof makeAuth> | null = null
const makeAuth = () => createAuthClient({ baseURL: `${window.location.origin}/api/auth`, plugins: [usernameClient()] })

/** Typed Hono RPC client (request/response types inferred from apps/api routes). */
export function useApi(): ApiClient {
  return (api ??= createApiClient(window.location.origin))
}
/** Better Auth's own typed client for its delegated sign-in/out routes. */
export function useAuthClient() {
  return (authClient ??= makeAuth())
}

/** Normalises a typed ID like "ABCD-efgh 2345…" to the stored lowercase username. */
export const normalizeAccountId = (s: string) => s.replace(/[\s-]/g, '').toLowerCase()
