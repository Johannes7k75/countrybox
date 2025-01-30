import { defineConfig } from "auth-astro";
import Credentials from "@auth/core/providers/credentials"
import {} from "@auth/core/adapters"
import { db, eq, User } from "astro:db";
import { object, string } from "astro:schema";

const signInSchema = object({
    email: string({ required_error: "Email is required" })
    .min(1, "Email is required")
    .email("Invalid email"),
  password: string({ required_error: "Password is required" })
    .min(1, "Password is required")
    .min(8, "Password must be more than 8 characters")
    .max(32, "Password must be less than 32 characters"),
})

export default defineConfig({
    providers: [
        Credentials({
            credentials: {
                email:{
                    label: "Email", type: "text",
                },
                password: {
                    label: "Password", type: "password",
                }
            },
            name: "Email",
            authorize:async(credentials)=>{
                const {email,password} = await signInSchema.parseAsync(credentials)

                const user = await db.select().from(User).where(eq(User.email, email)).limit(1).

                return user
            }
        })
    ]
})