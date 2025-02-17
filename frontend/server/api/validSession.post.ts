import { z } from "zod"

const bodySchema = z.object({
    email: z.string().email(),
    token: z.string()
})

export default defineEventHandler(async(event)=>{
    const {email,token} = await readValidatedBody(event, bodySchema.parse)

    const validUsers = await useDrizzle().select().from(tables.Users).where(
        and(
            eq(tables.Users.email, email),
            eq(tables.Users.sessionToken, token)
        )
    )

    if (validUsers.length == 0) {
        return false
    }

    if (validUsers.length > 1) {
        throw createError({
            statusCode: 401,
            message: "To many User exists"
        })
    }

    return true
})