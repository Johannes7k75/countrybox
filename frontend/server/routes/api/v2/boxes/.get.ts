import { getFlagBox } from "~~/server/box/FlagBox";

export default defineEventHandler(async(event)=>{
    const user = event.context.user;

    if (!user) return 

    const flagBox = await getFlagBox(user.id);

    flagBox?.add("deu")
    flagBox?.train("deu", true)

    return flagBox?.json();
})