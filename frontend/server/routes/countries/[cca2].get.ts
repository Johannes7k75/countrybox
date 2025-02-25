import { findCountryByCca2 } from "~~/server/lib/db/countries"

export default defineEventHandler(async (event) => {
  const cca2 = getRouterParam(event, "cca2")
  if (!cca2) {
    return sendRedirect(event, "/countries")
  }

  return findCountryByCca2(cca2)
})
