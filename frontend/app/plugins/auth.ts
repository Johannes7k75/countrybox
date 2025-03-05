import { useAuth } from "~/composables/useAuth"

export default defineNuxtPlugin(async (nuxtApp) => {
    const { me } = useAuth()

    await me()
})
