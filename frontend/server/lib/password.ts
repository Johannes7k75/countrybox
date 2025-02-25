import { hash, verify } from "@node-rs/argon2";

export async function hashPassword(plainPassword: string) {
    return await hash(plainPassword,{
        memoryCost: 19456,
        timeCost: 2,
        outputLen: 32,
        parallelism: 1,
    })
}

export async function verifyPassword(password: string, plainPassword: string) {
    // if (password.startsWith("$scrypt")) {
    //     const hashed = await hashPassword(plainPassword)
    //     await useDrizzle().update(tables.Users).set({password: hashed}).where(eq(tables.Users.password, password))
    //     password = hashed
    // }

    return await verify(password, plainPassword)
}