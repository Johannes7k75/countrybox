import { count } from "drizzle-orm";
import crypto from "node:crypto"

function generateRandomNumber(length: number) {
    const bytes = crypto.randomBytes(Math.ceil(length / 2));
    return bytes.toString('hex').slice(0, length);
}

async function accountWithAccountId(accountId: string) {
    const [{ count: c }] = await useDrizzle().select({ count: count() }).from(tables.Users).where(eq(tables.Users.email, accountId))
    return c
}

export default defineEventHandler(async (event) => {
    let accountId = generateRandomNumber(16)

    while (await accountWithAccountId(accountId) > 0) {
        accountId = generateRandomNumber(16)
    }

    return accountId
})