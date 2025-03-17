export const useTlds = ()=>{
    const tldMap = useState("tldMap", async()=>{
        const tlds = await $fetch("/api/v2/tlds")
        const tldMap = new Map<number, string>();

        tlds.map(({countryId, tld})=>tldMap.set(countryId,  tld))

    })
    
}