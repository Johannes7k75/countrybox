import { z } from "zod";
import { randomUUID } from "node:crypto";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export default defineEventHandler(async (event) => {
  const { email, password } = await readValidatedBody(event, bodySchema.parse);

  const users = await useDrizzle()
    .select()
    .from(tables.Users)
    .where(eq(tables.Users.email, email));

  if (users.length > 0) {
    throw createError({
      statusCode: 401,
      message: "Email already taken",
    });
  }

  const sessionToken = randomUUID();
  const newUser = await useDrizzle()
    .insert(tables.Users)
    .values([
      {
        email,
        hash: await hashPassword(password),
        sessionToken: sessionToken,
      },
    ]);

  if (newUser[0].fieldCount == 0) {
    throw createError({
      statusCode: 401,
      message: "Error when creating user",
    });
  }

  console.log("New User created!");

  await setUserSession(event, {
    user: {
      email: email,
      token: sessionToken,
    },
  });

  return {};
});
