import { z } from 'zod'
import { Codes, generateNewToken, getToken } from '../auth/token'

const bodySchema = z.object({
    email: z.string().email(),
    password: z.string().min(8)
})

export default defineEventHandler(async (event) => {
    const { email, password } = await readValidatedBody(event, bodySchema.parse)

    const users = await useDrizzle().select().from(tables.Users).where(eq(tables.Users.email, email))

    if (users.length > 0 && await verifyPassword(users[0].hash, password)) {
        const generateToken = await generateNewToken(users[0].email)
        if (generateToken === Codes.GENERATE_TOKEN_ERROR) {
            throw createError({
                statusCode: 401,
                message: "Token could not be generated"
            })
        }

        const token = await getToken(users[0].email)
        if (!token) {
            throw createError({
                statusCode: 401,
                message: "Could not get token"
            })
        }        

        await setUserSession(event, {
            user: {
                email: users[0].email,
                token: token
            }
        })
        return {}
    }
    throw createError({
        statusCode: 401,
        message: 'Bad credentials'
    })
})
