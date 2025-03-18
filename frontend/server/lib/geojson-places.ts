// import fs from "node:fs"

import * as _countries from "./data/countries.json"

type Country = {
    country_a2: string, country_a3: string, country_name: string, i18n: Record<string, string>
}

const countries = _countries as Country[]

export function getCountryGeoJSON(code: string) {
    return code.length === 2 
        ? getCountryGeoJSONByAlpha2(code)
        : getCountryGeoJSONByAlpha3(code)
}

export async function getCountryGeoJSONByAlpha2(cca2: string) {
    try {
        const importPath = `./data/${cca2.toUpperCase()}.json`;
        console.log(importPath)
        const country = await import(importPath)
        // const country = fs.readFileSync(`./data/countries/${cca2.toUpperCase()}.json`, "utf8")
        return country.default
    } catch (e){
        console.log(e)
        return null
    }
}
export function getCountryGeoJSONByAlpha3(cca3: string) {
    let {cca2} = resolveAlpha(cca3)
    return getCountryGeoJSONByAlpha2(cca2)
}

export function resolveAlpha(code: string): {cca2: string, cca3: string} {
    return {
        cca2: code.length == 2 ? code : countryAlpha3ToAlpha2(code)!,
        cca3: code.length == 3 ? code : countryAlpha2ToAlpha3(code)!
    }
}

export function countryAlpha3ToAlpha2(cca3: string): string | null{
    const country = countries.find(item => item.country_a3 === cca3.toUpperCase())
    return country?.country_a2 ?? null
}

export function countryAlpha2ToAlpha3(cca2: string): string | null {
    const country = countries.find(item => item.country_a2 === cca2.toUpperCase())
    return country?.country_a3 ?? null
}