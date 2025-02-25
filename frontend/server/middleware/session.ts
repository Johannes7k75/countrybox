import type { User } from "~~/server/lib/user";
import { getUserFromSession } from "../utils/session";

export default defineEventHandler(async (event)=>{
    const user = await getUserFromSession(event);
    if (user) event.context.user = user;
})

declare module "h3" {
    interface H3EventContext {
        user?: User;
    }
}