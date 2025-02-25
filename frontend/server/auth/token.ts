import { randomUUID } from "node:crypto";

export enum Codes {
  GENERATE_TOKEN_ERROR,
  GENERATE_TOKEN_SUCCESS,
}

export async function generateNewToken(email: string) {
  const users = await useDrizzle()
    .select()
    .from(tables.Users)
    .where(eq(tables.Users.email, email))
    .limit(1);

  if (users.length == 0 || users.length > 1) {
    console.log("To many or to few users");
    return Codes.GENERATE_TOKEN_ERROR;
  }
  const user = users[0];

  if (user.sessionToken) {
    console.log("Session already exists");
    return Codes.GENERATE_TOKEN_SUCCESS;
  }

  const sessionToken = randomUUID();
  await useDrizzle()
    .update(tables.Users)
    .set({ sessionToken })
    .where(eq(tables.Users.email, email));

  return Codes.GENERATE_TOKEN_SUCCESS;
}

export async function clearToken(email: string) {
  const users = await useDrizzle()
    .select()
    .from(tables.Users)
    .where(eq(tables.Users.email, email))
    .limit(1);

  if (users.length == 0 || users.length > 1) {
    return false;
  }

  await useDrizzle()
    .update(tables.Users)
    .set({ sessionToken: null })
    .where(eq(tables.Users.email, email));

  return true;
}

export async function getToken(email: string) {
  const users = await useDrizzle()
    .select()
    .from(tables.Users)
    .where(eq(tables.Users.email, email))
    .limit(1);

  if (users.length == 0 || users.length > 1) {
    return null;
  }

  return users[0].sessionToken;
}
