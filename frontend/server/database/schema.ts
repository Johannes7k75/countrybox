import {
  json,
  int,
  mysqlTable,
  varchar,
  boolean,
  datetime,
} from "drizzle-orm/mysql-core";

export const Countries = mysqlTable("countries", {
  id: int("id").primaryKey().autoincrement().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  capital: varchar("capital", { length: 255 }).notNull(),
  independent: boolean("independent").notNull(),
  region: varchar("region", { length: 255 }).notNull(),
  subregion: varchar("subregion", { length: 255 }).notNull(),
  cca3: varchar("cca3", { length: 3 }).notNull(),
  cca2: varchar("cca2", { length: 2 }).notNull(),
  callingCode: varchar("callingCode", { length: 10 }),
});

export const Tld = mysqlTable("tld", {
  id: int("id").primaryKey().autoincrement().notNull(),
  tld: varchar("tld", { length: 10 }).notNull(),
  countryId: int("countryId")
    .notNull()
    .references(() => Countries.id),
});

export const Users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement().notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  hash: varchar("hash", { length: 255 }).notNull(),
  sessionToken: varchar("session",{length: 36}),
});

export const GameTypes = mysqlTable("gameTypes", {
  id: int("id").primaryKey().autoincrement().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
});

export const Games = mysqlTable("games", {
  id: int("id").primaryKey().autoincrement().notNull(),
  userId: int("userId")
    .notNull()
    .references(() => Users.id),
  gameType: int("gameType")
    .notNull()
    .references(() => GameTypes.id),
  round: int("round").default(0).notNull(),
  rounds: int("rounds").default(10).notNull(),
  startedAt: datetime("startedAt").default(new Date()).notNull(),
  finishedAt: datetime("finishedAt"),
});

export const GameRounds = mysqlTable("gameRounds", {
  id: int("id").primaryKey().autoincrement().notNull(),
  gameId: int("gameId")
    .notNull()
    .references(() => Games.id),
  round: int("round").default(0).notNull(),
  answers: json("answers").$type<{
    id: number;
    correct: boolean;
  }>(),
});

export const Boxes = mysqlTable("boxes", {
  id: int("id").primaryKey().autoincrement().notNull(),
  userId: int("userId").references(() => Users.id),
  countryId: int("countryId").references(() => Countries.id),
  trainedAt: datetime("trainedAt"),
  phase: int("phase").default(0).notNull(),
});
