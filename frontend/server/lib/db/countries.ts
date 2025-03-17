import {resolve} from "../code"

export async function findAllCountries() {
    return useDrizzle().select().from(tables.Countries)
}

export async function findCountryByCode(code: string) {
    const {cca2} = resolve(code)
    const countries = await useDrizzle().select().from(tables.Countries).where(eq(tables.Countries.cca2, cca2))
    return countries.length > 0 ? countries[0]:null
}

export async function findCountryById(id: number) {
    const countries = await useDrizzle().select().from(tables.Countries).where(eq(tables.Countries.id, id))
    return countries.length > 0 ? countries[0]:null
}