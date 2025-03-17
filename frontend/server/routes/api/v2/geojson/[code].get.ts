import {getCountryGeoJSONByAlpha2} from "geojson-places"
import { resolve } from "~~/server/lib/code"

export default defineEventHandler(async(event)=>{
    const code = getRouterParam(event, "code")

    if (!code) {
        return createError({
            statusCode: 400,
            message: "No code given."
        })
    }

    const {cca2} = resolve(code)

    return getCountryGeoJSONByAlpha2(cca2)
})