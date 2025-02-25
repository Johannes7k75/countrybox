import {findAllTldsInCountryCca2s} from "~~/server/lib/db/tlds"

export default defineEventHandler(async (event) => {
  return findAllTldsInCountryCca2s(["de"])
})