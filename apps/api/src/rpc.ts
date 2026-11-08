// Type-only entry for @countrybox/api-client. Importing this module at runtime is a bug.
export type { routes } from './app'
import type { routes } from './app'
export type ApiType = typeof routes
