export const useCountry = () => {
    const tldMap = useState("country:tlds", ()=>{
        const map = new Map<string, string>()
        $fetch("/api/v2/tld").then((flags=>flags.forEach(f=>map.set(f.cca3, f.name))))
        return map;
    })
    const flagNames = useState("country:names",()=>{
        const map = new Map<string, string>()
        $fetch("/api/v2/flags/names").then()
    })

    const getName = (cca3: string) => {
        return flagNames.value.get(cca3)
    } 

    const getTld = (cca3: string) => {
        return tldMap.value.get(cca3)
    }

    return {
        getName, getTld
    }

}