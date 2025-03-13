export default defineEventHandler(async (event) => {
    const user = event.context.user
    const cca2 = getRouterParam(event, "cca2")

    if (!cca2 || !user) return;

    const [country] = await useDrizzle().select({ id: tables.Countries.id }).from(tables.Countries).where(eq(tables.Countries.cca2, cca2))

    const [boxCountry] = (await useDrizzle().select().from(tables.Boxes).where(and(eq(tables.Boxes.userId, user.id),eq(tables.Boxes.countryId, country.id))))

    if (!boxCountry) {
        await useDrizzle().insert(tables.Boxes).values({
            countryId: country.id,
            phase: 0,
            trainedAt: new Date(),
            userId: 1
        })
    } else {
        await useDrizzle().update(tables.Boxes).set({
            phase: boxCountry.phase+1,
        }).where(eq(tables.Countries.id, boxCountry.id))
    }

})