export default defineEventHandler(async(event)=>{
    const code = getRouterParam(event, "code")

    if (!code) {
        return createError({
            statusCode: 400,
            message: "No code given."
        })  
    }

    const [country] = await useDrizzle().select().from(tables.Countries).where(eq(tables.Countries.cca2, code))

    return country
})