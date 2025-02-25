import { findAllCountries } from "~~/server/lib/db/countries"

export default defineEventHandler(async (event) => {
  return findAllCountries()
})
