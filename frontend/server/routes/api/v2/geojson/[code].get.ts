import { getCountryGeoJSON } from "~~/server/lib/geojson-places"

import fs from "node:fs"

export default defineEventHandler(async(event)=>{
    const code = getRouterParam(event, "code")

    if (!code) {
        return createError({
            statusCode: 400,
            message: "No code given."
        })
    }

    console.log(import.meta, fs.readdirSync("."))

    return await getCountryGeoJSON(code)
})