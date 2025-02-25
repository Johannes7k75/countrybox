import { useAuthUser } from "~/composables/useAuthUser"

export default defineNuxtRouteMiddleware((to, from) => {
    const user = useAuthUser()

    if (!user.value) return navigateTo({name: "login"})
})
