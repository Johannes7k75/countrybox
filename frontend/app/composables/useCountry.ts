import * as db from "~~/shared/database"

export const useCountry = () => {
    const tldMap = useState<Map<string, string>>("country:tlds", () => new Map())
    const flagNames = useState<Map<string, string>>("country:names", () => new Map())

    const fetchTlds = async () => {
        if (tldMap.value.size > 0) return
        const tlds = await useApi().fetch<db.Tld[]>("/tlds")
        // const tlds = await $fetch<{ countryId: string; tld: string }[]>("/api/v3/tlds")
        const map = new Map<string, string>()
        tlds.forEach(({ countryCode, tld }) => map.set(countryCode.toString(), tld))
        tldMap.value = map
    }

    const fetchFlagNames = async () => {
        if (flagNames.value.size > 0) return
        const names = await useApi().fetch<{cca2: string, name: string}[]>("/countries/names")
        const map = new Map<string, string>()
        names.forEach(({ cca2, name }) => map.set(cca2, name))
        flagNames.value = map
    }

    // Lazy load when accessed
    const getName = async (cca2: string) => {
        if (flagNames.value.size === 0) await fetchFlagNames()
        return flagNames.value.get(cca2) || null
    }

    const getTld = async (cca2: string) => {
        if (tldMap.value.size === 0) await fetchTlds()
        return tldMap.value.get(cca2) || null
    }

    return {
        getName,
        getTld,
        fetchTlds,
        fetchFlagNames
    }
}
