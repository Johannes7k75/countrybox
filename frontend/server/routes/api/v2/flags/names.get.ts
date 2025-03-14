export default defineEventHandler(async(event)=>{

    return useDrizzle().select({id: tables.Countries.cca3, name: tables.Countries.name}).from(tables.Countries)
})