export default defineEventHandler(async (event) => {
  return await useDrizzle()
    .select({
      code: tables.Countries.cca3,
    })
    .from(tables.Countries);
});
