import { useAuth } from "~/composables/useAuth"

export default defineNuxtPlugin(async (nuxtApp) => {
    const { me } = useAuth()

    console.log("Get me")

    console.log(await me())
})
