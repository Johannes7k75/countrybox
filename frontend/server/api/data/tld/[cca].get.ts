export default defineEventHandler(async(event)=>{
    const cca = event.context.params!.cca
    const isCca2 = cca.length===2

    return await useDrizzle().select({tld: tables.Tld.tld}).from(tables.Tld).innerJoin(tables.Countries, eq(tables.Tld.countryId, tables.Countries.id)).where(eq(isCca2?tables.Countries.cca2:tables.Countries.cca3, cca))
})