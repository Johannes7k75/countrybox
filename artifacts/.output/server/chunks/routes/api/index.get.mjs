import { c as defineEventHandler, r as requireUserSession, e as useDrizzle, f as tables } from '../../_/nitro.mjs';
import { g as getFlagBox } from '../../_/FlagBox.mjs';
import { eq } from 'drizzle-orm';
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
  const { user: { name } } = await requireUserSession(event);
  const users = await useDrizzle().select().from(tables.Users).where(eq(tables.Users.email, name));
  if (!users || users.length == 0) return;
  const user = users[0];
  const flagBox = await getFlagBox(user.id);
  return flagBox.json();
});

export { index_get as default };
//# sourceMappingURL=index.get.mjs.map
