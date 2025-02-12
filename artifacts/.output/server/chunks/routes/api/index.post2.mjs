import { c as defineEventHandler, g as readValidatedBody, e as useDrizzle, f as tables } from '../../_/nitro.mjs';
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

const keys = tables.Countries;
const keyEnum = z.enum(
  Object.keys(keys)
);
const bodySchema = z.object({
  mapping: z.record(keyEnum).optional()
});
const index_post = defineEventHandler(async (event) => {
  const { mapping } = await readValidatedBody(event, bodySchema.parse);
  let select = useDrizzle().select();
  if (mapping) {
    const selectedFields = Object.keys(mapping).map(
      (k) => ({
        [k]: tables.Countries[mapping[k]]
      })
    ).reduce((p, c) => Object.assign(p, c), {});
    select = useDrizzle().select(selectedFields);
  }
  return await select.from(tables.Countries);
});

export { index_post as default };
//# sourceMappingURL=index.post2.mjs.map
