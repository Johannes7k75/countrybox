import { notInArray } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const answers: {
    id: typeof tables.Countries.$inferSelect.id;
    name: typeof tables.Countries.$inferSelect.name;
    capital: typeof tables.Countries.$inferSelect.capital;
    callCode: typeof tables.Countries.$inferSelect.callingCode;
    cca2: typeof tables.Countries.$inferSelect.cca2;
    cca3: typeof tables.Countries.$inferSelect.cca3;
    tld: typeof tables.Tld.$inferSelect.tld;
  }[] = [];

  while (answers.length < 4) {
    const answer = await useDrizzle()
      .select({
        id: tables.Countries.id,
        name: tables.Countries.name,
        capital: tables.Countries.capital,
        callCode: tables.Countries.callingCode,
        cca2: tables.Countries.cca2,
        cca3: tables.Countries.cca3,
        tld: tables.Tld.tld,
      })
      .from(tables.Countries)
      .where(
        and(
          answers.length > 0
          ? notInArray(
              tables.Countries.id,
              answers.map((a) => a.id),
            )
          : undefined,
          eq(tables.Countries.independent, true)
        ),
      )
      .orderBy(sql`RAND()`)
      .innerJoin(tables.Tld, eq(tables.Countries.id, tables.Tld.countryId))
      .limit(1)
      .execute();
    answers.push(answer[0]);
  }

  return answers;
});
