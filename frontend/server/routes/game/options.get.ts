import { isNull, notInArray } from "drizzle-orm";

export default defineEventHandler(async (event) => {
    const user = event.context.user;

    const answers: {
        countries: typeof tables.Countries.$inferSelect,
        tld: typeof tables.Tld.$inferSelect
    }[] = []
    const lockedCountries: (typeof tables.Countries.$inferSelect.id)[] = []

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
        ).limit(100)

        correctGuessedOptions.forEach(({ id }) => lockedCountries.push(id))
    }

    while (answers.length < 4) {
        const answer = await useDrizzle().select().from(tables.Countries).where(lockedCountries.length > 0 ? notInArray(tables.Countries.id, lockedCountries) : undefined).orderBy(sql`RAND()`).innerJoin(tables.Tld, eq(tables.Countries.id, tables.Tld.countryId)).limit(1).execute()

        lockedCountries.push(answer[0].countries.id);
        answers.push(answer[0]);
    }

    return answers;
})