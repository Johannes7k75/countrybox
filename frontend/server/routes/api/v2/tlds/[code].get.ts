export default defineEventHandler(async(event)=>{
    const code = getRouterParam(event, "code")

    if (!code) {
        return createError({
            statusCode: 400,
            message: "No code given."
        })
    }

    const [tld]=await useDrizzle().select().from(tables.Tld).where(eq(tables.Tld.countryCode, code))
    return tld
})