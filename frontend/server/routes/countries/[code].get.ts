import { findCountryByCode } from "~~/server/lib/db/countries"

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, "code")
  if (!code) {
    return sendRedirect(event, "/countries")
  }

  return await findCountryByCode(code)
})
