import { count } from "drizzle-orm";

export const roles = ["ADMIN", "USER"] as const
export type UserRoles = typeof roles[number][]

export interface User {
    id: string;
    email: string;
    password: string;
    roles: UserRoles;
}

export async function findAllUsers() {
    return useDrizzle().select().from(tables.Users)
}

export async function findUserByEmail(email: string) {
    const users = await useDrizzle().select().from(tables.Users).where(eq(tables.Users.email, email))
    return users.length > 0? users[0] :null
}

export async function findUserById(id: number) {
    const users = await useDrizzle().select().from(tables.Users).where(eq(tables.Users.id, id))
    return users.length > 0 ? users[0]: null
}

export async function createUser(email: string, password: string) {
    const [sameEmails] = await useDrizzle().select({count: count()}).from(tables.Users).where(eq(tables.Users.email, email))
    if (sameEmails.count > 0)  {
        return null
    }

    await useDrizzle().insert(tables.Users).values([{email, password, roles: ["USER"]}])
    
    return findUserByEmail(email)
}

export async function isAdmin(user?: User) {
    return user && user.roles.includes("ADMIN")
}