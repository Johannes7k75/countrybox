import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./server/database/schema.ts",
  out: "./server/database/migrations",

  dialect: "mysql",
  dbCredentials: {
    url: process.env.DB_URL as string,
  },
});
