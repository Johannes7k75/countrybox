import { getFlagBox } from "~~/server/box/FlagBox"

export default defineEventHandler(async(event)=>{
    const {user: {email}} = await requireUserSession(event)

    const users = await useDrizzle().select().from(tables.Users).where(eq(tables.Users.email, email))
    if (!users || users.length == 0) return

    const user = users[0]

    const flagBox = await getFlagBox(user.id)
    
    return flagBox?.json()

})