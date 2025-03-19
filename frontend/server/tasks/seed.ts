import { hashPassword } from "../lib/password";
import { tables } from "../utils/drizzle";

import fs from "node:fs"

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
      sql`ALTER TABLE 'boxes' AUTO_INCREMENT = 1;`,
    );

    await useDrizzle().delete(tables.Users);
    useDrizzle().execute(
      sql`ALTER TABLE 'users' AUTO_INCREMENT = 1;`,
    );
    await useDrizzle()
      .insert(tables.Users)
      .values([
        {
          email: "jonas@jospace.de",
          password: await hashPassword("Freddy!2024")
        },
      ]);
    console.log("Seeded users...");

    if (seedCountries) {
      await useDrizzle().delete(tables.Tld);
      useDrizzle().execute(
        sql`ALTER TABLE 'tld' AUTO_INCREMENT = 1;`,
      );

      // await useDrizzle().delete(tables.callingCodes);
      // useDrizzle().execute(
      //   sql`UPDATE sqlite_sequence SET seq = 0 WHERE name = 'callingCodes'`
      // );

      await useDrizzle().execute(sql`SET FOREIGN_KEY_CHECKS = 0`);
      await useDrizzle().delete(tables.Countries);

      await useDrizzle().execute(sql`TRUNCATE geoJson`);
      await useDrizzle().execute(sql`SET FOREIGN_KEY_CHECKS = 1`);



      useDrizzle().execute(
        sql`ALTER TABLE 'countries' AUTO_INCREMENT = 1;`,
      );

      let i = 0;
      for (const contry of countries) {
        await useDrizzle()
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
              unMember: contry.unMember
            },
          ])

        contry.tlds.forEach(async (tld) => {
          await useDrizzle()
            .insert(tables.Tld)
            .values({
              countryCode: contry.cca2.toLowerCase(),
              tld: tld,
            });
        });

        i++;
      }
      console.log(`Seeded ${i} countries...`);
    }

    const boxes: (typeof tables.Boxes.$inferInsert)[] = [];
    for (let i = 0; i < 6; i++) {
      const [{ cca2: countryCode }] = await useDrizzle()
        .select({ cca2: tables.Countries.cca2 })
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
        countryCode,
        phase: i,
      });
    }

    await useDrizzle().insert(tables.Boxes).values(boxes);
    console.log("Seeded boxes...");

    const geojsons = fs.readdirSync("./server/tasks/data")
    await useDrizzle().insert(tables.GeoJson).values(geojsons.map(g=>{
      const data = fs.readFileSync(`./server/tasks/data/${g}`, "utf8")
      const code = g.split(".")[0]
      if (code.length != 2) return
      return {
        countryCode: code.toLowerCase() as string,
        geoJson: JSON.parse(data) as GeoJSON.GeoJSON
      }
    }).filter(x=>!!x))
    console.log(`Seeded geoJson...`)

    return { result: "success" };
  },
});
