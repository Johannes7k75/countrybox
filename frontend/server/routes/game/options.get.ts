import { isNull } from "drizzle-orm";

export default defineEventHandler(async(event)=>{
    const user = event.context.user;

    if (user) {
        const [currectGame] = await useDrizzle().select().from(tables.Games).where(and(
            eq(tables.Games.userId, user.id),
            isNull(tables.Games.finishedAt)
        )).limit(1)

        const correctGuessedOptions = await useDrizzle().select().from(tables.GuessedFlags).where(
            and(
                eq(tables.GuessedFlags.gameId, currectGame.id),
                eq(tables.GuessedFlags.correct, true)
            )
        )
    }
})