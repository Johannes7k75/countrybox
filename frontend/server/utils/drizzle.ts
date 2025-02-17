import { drizzle } from "drizzle-orm/mysql2";
export { sql, eq, and, or } from "drizzle-orm";

import * as schema from "../database/schema";
import mysql from "mysql2/promise";

export const tables = schema


declare global {
  var _db: ReturnType<typeof drizzle> | undefined;
}




const connection = mysql.createPool({
  uri: process.env.DB_URL,
});

const db = globalThis._db || drizzle(connection, {schema, mode: "default"})
if (process.env.NODE_ENV !== "production") {
  globalThis._db = db;
}

// const drzl = drizzle(connection, { schema: schema, mode: "default" })

export function useDrizzle() {
  return db
}

export type User = typeof schema.Users.$inferSelect;
export type Country = typeof schema.Countries.$inferSelect;
export type GameRound = typeof schema.GameRounds.$inferSelect;
export type GameType = typeof schema.GameTypes.$inferSelect;
export type Game = typeof schema.Games.$inferSelect;
export type Tld = typeof schema.Tld.$inferSelect;
