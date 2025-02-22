import { SelectedFields } from "drizzle-orm/sqlite-core";
import { z, ZodError, ZodSchema } from "zod";

type H3Event = import("h3").H3Event

const keys = tables.Countries;

const keyEnum = z.enum(
  Object.keys(keys) as [keyof typeof keys, ...Array<keyof typeof keys>]
);

const paramsSchema = z.record(keyEnum).optional();

async function parseParams<T>(event: H3Event, paramsSchema: ZodSchema<T>["parse"]): Promise<T> {
  try {
    const params = Object.fromEntries(new URLSearchParams(event.path.split("?")[1]));

    const validatedBody = paramsSchema(params);

    return validatedBody;
  } catch (error) {
    if (error instanceof ZodError) {
      console.error("Validation error:", error.errors);
      throw new Error("Invalid body data");
    }

    console.error("Error parsing the body:", error);
    throw new Error("Failed to parse body");
  }
}

export default defineEventHandler(async (event) => {
  const params = await parseParams(event, paramsSchema.parse);

  let select = useDrizzle().select();


  console.log(params)

  if (params) {
    const selectedFields = Object.keys(params)
      .map(
        (k) =>
          ({
            [k]: tables.Countries[params[k as keyof typeof keys]],
          } as SelectedFields)
      )
      .reduce((p, c) => Object.assign(p, c), {});
    select = useDrizzle().select(selectedFields);
  }

  return await select.from(tables.Countries);
});
