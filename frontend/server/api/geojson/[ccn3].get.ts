export default defineEventHandler(async (event)=>{
    const {ccn3} = event.context.params!
    const geoJson = await $fetch<GeoJSON.GeoJSON>(`https://raw.githubusercontent.com/mledoze/countries/refs/heads/master/data/${ccn3}.geo.json`,{
        headers: {
            "Content-Type": "application/vnd.geo+json;charset=utf-8"
        }
    })

    console.log(ccn3)

    setResponseHeader(event, "Content-Type", "application/vnd.geo+json")
    return geoJson
})