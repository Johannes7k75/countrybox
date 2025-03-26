export const useApi = () => {
    const api = useState("api:v3", () => $fetch.create({
        baseURL: "/api/v3"
    }))

    return { fetch: api.value }
}