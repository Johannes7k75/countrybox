import { SelectedFields } from "drizzle-orm/sqlite-core";
import {  z } from "zod";

const keys = tables.Countries;

const keyEnum = z.enum(
  Object.keys(keys) as [keyof typeof keys, ...Array<keyof typeof keys>]
);

const bodySchema = z.object({
  mapping: z.record(keyEnum).optional(),
});

export default defineEventHandler(async (event) => {
  const { mapping } = await readValidatedBody(event, bodySchema.parse);

  let select = useDrizzle().select();

  if (mapping) {
    const selectedFields = Object.keys(mapping)
      .map(
        (k) =>
          ({
            [k]: tables.Countries[mapping[k as keyof typeof keys]],
          } as SelectedFields)
      )
      .reduce((p, c) => Object.assign(p, c), {});
    select = useDrizzle().select(selectedFields);
  }

  return await select.from(tables.Countries)
});
