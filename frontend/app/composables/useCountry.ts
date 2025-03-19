export const useCountry = () => {
    const tldMap = useState<Map<string, string>>("country:tlds", () => new Map())
    const flagNames = useState<Map<string, string>>("country:names", () => new Map())

    const fetchTlds = async () => {
        if (tldMap.value.size > 0) return
        const tlds = await $fetch<{ countryId: string; tld: string }[]>("/api/v3/tlds")
        const map = new Map<string, string>()
        tlds.forEach(({ countryId, tld }) => map.set(countryId.toString(), tld))
        tldMap.value = map
    }

    const fetchFlagNames = async () => {
        if (flagNames.value.size > 0) return
        const names = await $fetch<{ cca3: string; name: string }[]>("/api/v3/countries/names")
        const map = new Map<string, string>()
        names.forEach(({ cca3, name }) => map.set(cca3, name))
        flagNames.value = map
    }

    // Lazy load when accessed
    const getName = async (cca3: string) => {
        if (flagNames.value.size === 0) await fetchFlagNames()
        return flagNames.value.get(cca3) || null
    }

    const getTld = async (cca3: string) => {
        if (tldMap.value.size === 0) await fetchTlds()
        return tldMap.value.get(cca3) || null
    }

    return {
        getName,
        getTld,
        fetchTlds,
        fetchFlagNames
    }
}
