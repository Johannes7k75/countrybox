import { drizzle } from 'drizzle-orm/better-sqlite3'
export { sql, eq, and, or } from 'drizzle-orm'

import * as schema from '../database/schema'

export const tables = schema

export function useDrizzle() {
  return drizzle("db.sqlite", { schema })
}

export type User = typeof schema.Users.$inferSelect
export type Country = typeof schema.Countries.$inferSelect
export type CallingCode = typeof schema.CallingCodes.$inferSelect
export type GameRound = typeof schema.GameRounds.$inferSelect
export type GameType = typeof schema.GameTypes.$inferSelect
export type Game = typeof schema.Games.$inferSelect
export type Tld = typeof schema.Tld.$inferSelect
