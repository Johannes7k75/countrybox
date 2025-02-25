export default defineEventHandler(async (event) => {
  const cca = event.context.params!.cca;
  const isCcn2 = cca.length === 2;

  return (
    await useDrizzle()
      .select()
      .from(tables.Countries)
      .where(eq(isCcn2 ? tables.Countries.cca2 : tables.Countries.cca3, cca))
  )[0];
});
