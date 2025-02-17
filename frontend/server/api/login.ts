import { z } from 'zod'

const bodySchema = z.object({
    email: z.string().email(),
    password: z.string().min(8)
})

export default defineEventHandler(async (event) => {
    const { email, password } = await readValidatedBody(event, bodySchema.parse)

    const users = await useDrizzle().select().from(tables.Users).where(eq(tables.Users.email, email))

    if (users.length > 0 && await verifyPassword(users[0].hash, password)) {
        // set the user session in the cookie
        // this server util is auto-imported by the auth-utils module
        await setUserSession(event, {
            user: {
                email: users[0].email
            }
        })
        return {}
    }
    throw createError({
        statusCode: 401,
        message: 'Bad credentials'
    })
})
