import { serialize, sign } from "~~/server/lib/cookie"
import { createUser } from "~~/server/lib/user"

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email: string, password: string }>(event)

  const { email, password } = body
  if (!email || !password) {
    throw createError({
      statusCode: 400,
      message: "Email address and password are required"
    })
  }

  const config = useRuntimeConfig()

  const userWithPassword = await createUser(email, password)
  if (!userWithPassword) {
    throw createError({
      statusCode: 400,
      message: "Email already used"
    })
  }

  const session = serialize({ userId: userWithPassword.id })
  const signedSession = sign(session, config.cookieSecret)

  setCookie(event, config.cookieName, signedSession, {
    httpOnly: true,
    path: "/",
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(Date.now() + parseInt(config.cookieRememberMeExpires))
  })

  const { password: _password, ...userWithoutPassword } = userWithPassword

  return {
    user: userWithoutPassword
  }

})
