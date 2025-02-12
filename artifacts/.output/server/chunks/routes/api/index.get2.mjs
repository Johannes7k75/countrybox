import { c as defineEventHandler, f as tables } from '../../_/nitro.mjs';
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

const index_get = defineEventHandler(async (event) => {
  return Object.keys(tables.Countries);
});

export { index_get as default };
//# sourceMappingURL=index.get2.mjs.map
