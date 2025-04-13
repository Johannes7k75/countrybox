export const useFlagNames = () => {

    const flagNames = useState("flagNames", () => {
        const mappedFlagNames = new Map<string, string>()

        useApi().fetch<{ name: string, cca2: string }[]>("/countries/names")
            .then((flagNames) => flagNames.forEach((flag) => mappedFlagNames.set(flag.cca2, flag.name)))

        return mappedFlagNames;
    })

    return flagNames

}