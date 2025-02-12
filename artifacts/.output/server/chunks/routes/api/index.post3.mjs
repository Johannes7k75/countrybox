import { c as defineEventHandler, e as useDrizzle, f as tables } from '../../_/nitro.mjs';
import { notInArray, sql } from 'drizzle-orm';
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

const index_post = defineEventHandler(async (event) => {
  const answers = [];
  while (answers.length < 4) {
    const answer = await useDrizzle().select().from(tables.Countries).where(answers.length > 0 ? notInArray(tables.Countries.id, answers.map((a) => a.id)) : void 0).orderBy(sql`random()`).limit(1);
    answers.push(answer[0]);
  }
  return answers;
});

export { index_post as default };
//# sourceMappingURL=index.post3.mjs.map
