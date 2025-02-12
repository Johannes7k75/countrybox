import { c as defineEventHandler, e as useDrizzle, f as tables } from '../../../_/nitro.mjs';
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

const codes = defineEventHandler(async (event) => {
  return await useDrizzle().select({
    code: tables.Countries.cca3
  }).from(tables.Countries);
});

export { codes as default };
//# sourceMappingURL=codes.mjs.map
