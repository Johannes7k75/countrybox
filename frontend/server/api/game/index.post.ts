import { notInArray } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const answers: (typeof tables.Countries.$inferSelect)[] = [];

  while (answers.length < 4) {
    const answer = await useDrizzle()
      .select()
      .from(tables.Countries)
      .where(
        answers.length > 0
          ? notInArray(
              tables.Countries.id,
              answers.map((a) => a.id)
            )
          : undefined
      )
      .orderBy(sql`RAND()`)
      .limit(1).execute();
    answers.push(answer[0]);
  }

  return answers;
});
