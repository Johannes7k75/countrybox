import {alpha2ToAlpha3, alpha3ToAlpha2} from "i18n-iso-countries"

export function resolve(code: string) {
    if (code.length == 2) {
        return {
            cca2: code.toLowerCase(),
            cca3: alpha2ToAlpha3(code)!.toLowerCase()
        }
    } else {
        return {
            cca2: alpha3ToAlpha2(code)!.toLowerCase(),
            cca3: code.toLowerCase()
        }
    }
}