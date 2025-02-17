import { inArray } from "drizzle-orm";
import { z } from "zod"

const bodySchema = z.object({
    countries: z.array(z.string().length(3)).optional(),
})

export default defineEventHandler(async (event) => {
    const { countries } = await readValidatedBody(event, bodySchema.parse);

  let select = useDrizzle().select().from(tables.Tld);

  if (countries && countries.length > 0) {
    // Query all country IDs in one efficient call
    const countryIdsQuery = await useDrizzle()
      .select({ id: tables.Countries.id,  })
      .from(tables.Countries)
      .where(inArray(tables.Countries.cca3, countries));

    const countryIds = countryIdsQuery.map(row => row.id);

    if (countryIds.length > 0) {
      select = select.where(inArray(tables.Tld.countryId, countryIds));
    }
  }

  return await select;

})