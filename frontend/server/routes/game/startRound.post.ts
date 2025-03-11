import { isNotNull } from "drizzle-orm";

export default defineEventHandler(async (event) => {
    const user = event.context.user;

    if (!user) return {roundId: null};

    
    const games = await useDrizzle().select().from(tables.Games).where(and(eq(tables.Games.userId, user.id), isNotNull(tables.Games.finishedAt)))
    
    for (const game of games) {
        await useDrizzle().update(tables.Games).set({ finishedAt: new Date() }).where(eq(tables.Games.id, game.id))
    }
    
    console.log("Start round")
    const [{ id }] = await useDrizzle().insert(tables.Games).values({
        userId: user.id,
        firstType: 1,
        secondType: 2
    }).$returningId()


    return { roundId: id }
})