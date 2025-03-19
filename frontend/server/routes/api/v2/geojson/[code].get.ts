export default defineEventHandler(async(event)=>{
    const code = getRouterParam(event, "code")

    if (!code) {
        return createError({
            statusCode: 400,
            message: "No code given."
        })
    }

    const [{geoJson}] = await useDrizzle().select().from(tables.GeoJson).where(eq(tables.GeoJson.countryCode, code))

    return geoJson
})