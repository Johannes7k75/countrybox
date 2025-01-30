import { defineConfig } from "auth-astro";
import Credentials from "@auth/core/providers/credentials"
import { db, eq } from "astro:db";

export default defineConfig({
    providers: [
        Credentials({
            credentials: {
                email:{},
                password: {}
            },
            name: "Email",
            authorize:async(credentials)=>{
                let user = null

                // const user = await db.select().from(User).where(eq(User.email, credentials.email))

                return user
            }
        })
    ]
})