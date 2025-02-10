import { blob, integer, sqliteTable, text,  } from "drizzle-orm/sqlite-core";

export const Countries = sqliteTable("countries",{
    id: integer("id").primaryKey({autoIncrement: true}).unique().notNull(),
    name: text("name").notNull(),
    capital: text("capital").notNull(),
    independent: integer("independent",{mode: "boolean"}).notNull(),
    region: text("region").notNull(),
    subregion: text("subregion").notNull(),
    cca3: text("cca3").notNull(),
    cca2: text("cca2"),
})

export const CallingCodes = sqliteTable("callingCodes",{
    id: integer("id").primaryKey({autoIncrement:true}).unique().notNull(),
    code: text("code").notNull(),
    countryId: integer("countryId").references(()=>Countries.id).notNull()
})

export const Tld = sqliteTable("tld", {
    id: integer("id").primaryKey({autoIncrement:true}).unique().notNull(),
    tld: text("tld").notNull(),
    countryId: integer("countryId").references(()=>Countries.id).notNull()
})

export const Users = sqliteTable("users", {
    id: integer("id").primaryKey({autoIncrement:true}).unique().notNull(),
    email: text("email").notNull(),
    hash: text("hash").notNull()
})

export const GameTypes = sqliteTable("gameTypes", {
    id: integer("id").primaryKey({autoIncrement:true}).unique().notNull(),
    name: text("name").notNull()
})

export const Games = sqliteTable("games", {
    id: integer("id").primaryKey({autoIncrement:true}).unique().notNull(),
    userId: integer("userId").references(()=>Users.id).notNull(),
    gameType: integer("gameType").references(()=>GameTypes.id).notNull(),

    round: integer("round").default(0).notNull(),
    rounds: integer("rounds").default(10).notNull(),
    startedAt: integer("startedAt",{mode: "timestamp"}).default(new Date()).notNull(),
    finishedAt: integer("finishedAt", {mode: "timestamp"})
})

export const GameRounds = sqliteTable("gameRounds",{
    id: integer("id").primaryKey({autoIncrement:true}).unique().notNull(),
    gameId: integer("gameId").references(()=>Games.id).notNull(),
    round: integer("round").default(0).notNull(),

    answers: blob("answers", {mode:"json"}).$type<{
        id: number,
        correct: boolean
    }>()
})

export const Boxes = sqliteTable("boxes", {
    id: integer("id").primaryKey({autoIncrement:true}).unique().notNull(),
    
    userId: integer("userId").references(()=>Users.id),
    countryId: integer("countryId").references(()=>Countries.id),
    trainedAt: integer("trainedAt", {mode: "timestamp"}),

    phase: integer("phase").default(0).notNull()
})