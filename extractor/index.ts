import { Cache } from "./Cache"
import type { Schema } from "./schema"

const url = "https://raw.githubusercontent.com/mledoze/countries/refs/heads/master/dist/countries-unescaped.json"

const cache = new Cache()

// cache.fetch("https://raw.githubusercontent.com/mledoze/countries/refs/heads/master/data/hnd.svg")

const data = await cache.fetch(url) as Schema[]

type Country = {
    name: Record<"official"|"common", string>,
    translations:  {[name: string]: Record<"official"|"common", string>},
    currencies: {[name: string]: Record<"name"|"symbol", string>},
    tld: string,
    independent: boolean,
    capital: string,
    region: string,
    subregion: string,
    flag: {
        emoji: string,
        url: string
    },
    callingCode: string
}

const extract: Country[] = []


data.forEach((v)=>{
    const flagUrl = `https://raw.githubusercontent.com/mledoze/countries/refs/heads/master/data/${v.cca3.toLowerCase()}.svg`
    cache.fetch(flagUrl)

    const flagUrl2 = `https://raw.githubusercontent.com/lipis/flag-icons/refs/heads/main/flags/4x3/${v.cca2.toLowerCase()}.svg`
    cache.fetch(flagUrl2)

    // const country: Country = {
    //     name: {
    //         common:v.name.common,
    //         official: v.name.official
    //     },
    //     translations: v.translations,
    //     callingCode: v.callingCodes[0],
    //     capital: v.capital[0],
    //     flag: {
    //         emoji: v.flag,
    //         url: flagUrl
    //     },
    //     currency: v.currencies,
    //     independent: v.independent??false,
    //     region: v.region,
    //     subregion:v.subregion,
    //     tld: v.tld[0]

    // }
      const country: Country = {
        name: v.translations.deu.common,
        cca3: v.cca3,
        cca2: v.cca2,
        capital: v.capital,
        independent:v.independent,
        region: v.region,
        subregion: v.subregion,
        tlds: v.tld,
        callingCodes: v.callingCodes,
    }
    extract.push(country)
})

// cache.putJson("countries.json", JSON.stringify(extract))

cache.put("countries.json", extract)

console.log("Extracted all data")