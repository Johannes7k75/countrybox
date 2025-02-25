import { inArray } from "drizzle-orm"
import { Country } from "~~/server/utils/drizzle"

export async function findAllTlds() {
    return useDrizzle().select().from(tables.Tld)
}

export async function findAllTldsInCountryIds(countryIds: Country["id"][]) {
    return useDrizzle().select().from(tables.Tld).where(inArray(tables.Tld.countryId, countryIds))
}

export async function findAllTldsInCountryCca2s(countryCca2s: Country["cca2"][]) {
    return await useDrizzle()
        .select()
        .from(tables.Tld)
        .innerJoin(tables.Countries, eq(tables.Tld.countryId, tables.Countries.id))
        .where(inArray(tables.Countries.cca2, countryCca2s));
}