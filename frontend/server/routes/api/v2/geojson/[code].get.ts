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

    console.log(code)

    const {cca2} = resolve(code)

    return await fetch(`http://127.0.0.1:3000/country/${cca2}/geojson`)
})