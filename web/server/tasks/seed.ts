import { tables } from "../utils/drizzle";

import countries from "../../../.cache/json/countries.json";

const seedCountries = false;

export default defineTask({
  meta: {
    name: "db:seed",
    description: "Run database seed task",
  },
  async run() {
    console.log("Running DB seed task...");

    await useDrizzle().delete(tables.Boxes);
    useDrizzle().run(
      sql`UPDATE sqlite_sequence SET seq = 0 WHERE name = 'boxes'`
    );

    await useDrizzle().delete(tables.Users);
    useDrizzle().run(
      sql`UPDATE sqlite_sequence SET seq = 0 WHERE name = 'users'`
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
      useDrizzle().run(
        sql`UPDATE sqlite_sequence SET seq = 0 WHERE name = 'tld'`
      );

      await useDrizzle().delete(tables.CallingCodes);
      useDrizzle().run(
        sql`UPDATE sqlite_sequence SET seq = 0 WHERE name = 'callingCodes'`
      );

      await useDrizzle().delete(tables.Countries);
      useDrizzle().run(
        sql`UPDATE sqlite_sequence SET seq = 0 WHERE name = 'countries'`
      );

      for (const contry of countries) {
        const { lastInsertRowid: countryId } = await useDrizzle()
          .insert(tables.Countries)
          .values([
            {
              name: contry.name,
              capital: contry.capital[0] ?? "",
              independent: contry.independent ?? true,
              cca3: contry.cca3.toLowerCase(),
              region: contry.region,
              subregion: contry.subregion,
            },
          ]);

        contry.tlds.forEach(async (tld) => {
          await useDrizzle()
            .insert(tables.Tld)
            .values({
              countryId: countryId as number,
              tld: tld,
            });
        });

        contry.callingCodes.forEach(async (code) => {
          await useDrizzle()
            .insert(tables.CallingCodes)
            .values({
              countryId: countryId as number,
              code: code,
            });
        });
      }
      console.log("Seeded countries...");
    }

    const boxes = []
    for (let i=0;i<6;i++) {
        boxes.push({
            userId: 1,
            countryId: Math.floor(Math.random()*countries.length),
            phase: i
        })
    }

    await useDrizzle()
      .insert(tables.Boxes)
      .values(boxes);
    console.log("Seeded boxes...");

    return { result: "success" };
  },
});
