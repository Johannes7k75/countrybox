export async function findAllCountries() {
    return useDrizzle().select().from(tables.Countries)
}

export async function findCountryByCca2(cca2: string) {
    const countries = await useDrizzle().select().from(tables.Countries).where(eq(tables.Countries.cca2, cca2))
    return countries.length > 0 ? countries[0]:null
}

export async function findCountryById(id: number) {
    const countries = await useDrizzle().select().from(tables.Countries).where(eq(tables.Countries.id, id))
    return countries.length > 0 ? countries[0]:null
}