import { c as defineEventHandler, g as readValidatedBody, e as useDrizzle, f as tables } from '../../../_/nitro.mjs';
import { inArray } from 'drizzle-orm';
import { z } from 'zod';
import '@adonisjs/hash';
import '@adonisjs/hash/drivers/scrypt';
import 'drizzle-orm/better-sqlite3';
import 'drizzle-orm/sqlite-core';
import 'node:crypto';
import 'node:http';
import 'node:https';
import 'node:fs';
import 'node:url';
import '@iconify/utils';
import 'consola/core';
import 'node:path';
import 'ipx';

const bodySchema = z.object({
  countries: z.array(z.string().length(3)).optional()
});
const callCodes_post = defineEventHandler(async (event) => {
  const { countries } = await readValidatedBody(event, bodySchema.parse);
  let select = useDrizzle().select().from(tables.CallingCodes);
  if (countries && countries.length > 0) {
    const countryIdsQuery = await useDrizzle().select({ id: tables.Countries.id }).from(tables.Countries).where(inArray(tables.Countries.cca3, countries));
    const countryIds = countryIdsQuery.map((row) => row.id);
    if (countryIds.length > 0) {
      select = select.where(inArray(tables.CallingCodes.countryId, countryIds));
    }
  }
  return await select;
});

export { callCodes_post as default };
//# sourceMappingURL=callCodes.post.mjs.map
