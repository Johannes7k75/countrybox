export default defineEventHandler(async(event)=>{

    return useDrizzle().select({cca3: tables.Countries.cca3, name: tables.Countries.name}).from(tables.Countries)
})