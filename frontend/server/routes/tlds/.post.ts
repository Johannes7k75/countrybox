import { z } from "zod"
import { findAllTldsInCountryCca2s } from "~~/server/lib/db/tlds"

const bodySchema = z.array(z.string())

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, bodySchema.parse)
  return findAllTldsInCountryCca2s(body)
})
