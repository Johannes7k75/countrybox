import { db, CallingCode, Country, eq, Tld } from 'astro:db';
import { z } from 'astro:schema';
import {readFileSync} from "node:fs"

const countriesSchema = z.array(
	z.object({
		name: z.string(),
		cca3:z.string(),
		capital: z.array(z.string()),
		independent: z.boolean().or(z.null()).default(true),
		region: z.string(),
		subregion: z.string(),
		tlds: z.array(z.string()),
		callingCodes: z.array(z.string())
	})
)

// https://astro.build/db/seed
export default async function seed() {
	// TODO

	const file = readFileSync("../.cache/json/countries.json", {encoding: "utf8"})
	// const countries = JSON.parse(file)

	const countries = countriesSchema.parse(JSON.parse(file))

	countries.forEach(async(c)=>{
		const [{countryId}] = await db.insert(Country).values({
			name: c.name,
			capital:c.capital[0]??"",
			independent:c.independent??true,
			cca3:c.cca3.toLowerCase(),
			region: c.region,
			sunregion: c.subregion
		}).returning({countryId: Country.id})

		c.tlds.forEach(async(tld)=>{
			await db.insert(Tld).values({
				tld,
				countryId
			})
		})

		c.callingCodes.forEach(async(callingCode)=>{
			await db.insert(CallingCode).values({
				code:callingCode,
				countryId
			})
		})
	})
}
