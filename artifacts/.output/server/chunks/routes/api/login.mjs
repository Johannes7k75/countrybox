import { c as defineEventHandler, g as readValidatedBody, e as useDrizzle, f as tables, v as verifyPassword, h as setUserSession, i as createError } from '../../_/nitro.mjs';
import { z } from 'zod';
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

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});
const login = defineEventHandler(async (event) => {
  const { email, password } = await readValidatedBody(event, bodySchema.parse);
  const users = await useDrizzle().select().from(tables.Users).where(eq(tables.Users.email, email));
  if (users.length > 0 && await verifyPassword(users[0].hash, password)) {
    await setUserSession(event, {
      user: {
        name: users[0].email
      }
    });
    return {};
  }
  throw createError({
    statusCode: 401,
    message: "Bad credentials"
  });
});

export { login as default };
//# sourceMappingURL=login.mjs.map
