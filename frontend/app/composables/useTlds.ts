import type { Tld } from "~~/shared/database";

export const useTlds = ()=>{
    const tldMap = useState("tldMap", async()=>{
        const tlds = await $fetch<Tld[]>("/api/v3/tlds")
        const tldMap = new Map<string, string>();

        tlds.map(({countryCode, tld})=>tldMap.set(countryCode,  tld))
    })
}