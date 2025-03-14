export const useFlagNames = ()=>{
    
    const flagNames = useState("flagNames",()=>{
        const mappedFlagNames = new Map<string, string>()
        $fetch('/api/v2/flags/names').then(flags=>flags.forEach(flag=>mappedFlagNames.set(flag.cca3, flag.name)))
        return mappedFlagNames;
    })

    return flagNames
    
}