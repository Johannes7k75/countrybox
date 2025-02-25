import { tables } from "../utils/drizzle";

import countries from "./countries.json";

const seedCountries = true;

export default defineTask({
  meta: {
    name: "db:seed",
    description: "Run database seed task",
  },
  async run() {
    console.log("Running DB seed task...");

    await useDrizzle().delete(tables.Boxes);
    useDrizzle().execute(
      sql`UPDATE sqlite_sequence SET seq = 0 WHERE name = 'boxes'`,
    );

    await useDrizzle().delete(tables.Users);
    useDrizzle().execute(
      sql`UPDATE sqlite_sequence SET seq = 0 WHERE name = 'users'`,
    );
    await useDrizzle()
      .insert(tables.Users)
      .values([
        {
          email: "jonas@jospace.de",
          hash: await hashPassword("Freddy!2024"),
        },
      ]);
    console.log("Seeded users...");

    if (seedCountries) {
      await useDrizzle().delete(tables.Tld);
      useDrizzle().execute(
        sql`UPDATE sqlite_sequence SET seq = 0 WHERE name = 'tld'`,
      );

      // await useDrizzle().delete(tables.callingCodes);
      // useDrizzle().execute(
      //   sql`UPDATE sqlite_sequence SET seq = 0 WHERE name = 'callingCodes'`
      // );

      await useDrizzle().delete(tables.Countries);
      useDrizzle().execute(
        sql`UPDATE sqlite_sequence SET seq = 0 WHERE name = 'countries'`,
      );

      let i = 0;
      for (const contry of countries) {
        console.log(i);
        const [{ id: countryId }] = await useDrizzle()
          .insert(tables.Countries)
          .values([
            {
              name: contry.name,
              capital: contry.capital ?? "",
              independent: contry.independent ?? true,
              cca3: contry.cca3.toLowerCase(),
              cca2: contry.cca2.toLowerCase(),
              region: contry.region,
              subregion: contry.subregion,
              callingCode: contry.callingCode,
            },
          ])
          .$returningId();

        contry.tlds.forEach(async (tld) => {
          await useDrizzle()
            .insert(tables.Tld)
            .values({
              countryId: countryId as number,
              tld: tld,
            });
        });

        i++;
      }
      console.log(`Seeded ${i} countries...`);
    }

    const boxes: (typeof tables.Boxes.$inferInsert)[] = [];
    for (let i = 0; i < 6; i++) {
      const [{ id: countryId }] = await useDrizzle()
        .select({ id: tables.Countries.id })
        .from(tables.Countries)
        .orderBy(sql`RAND()`)
        .limit(1)
        .execute();
      const [{ id: userId }] = await useDrizzle()
        .select()
        .from(tables.Users)
        .limit(1)
        .execute();

      boxes.push({
        userId: userId,
        countryId: countryId,
        phase: i,
      });
    }

    await useDrizzle().insert(tables.Boxes).values(boxes);
    console.log("Seeded boxes...");

    return { result: "success" };
  },
});
