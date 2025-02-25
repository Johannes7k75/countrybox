import { useAdmin } from "~/composables/useAdmin"

export default defineNuxtRouteMiddleware((to, from) => {
    const isAdmin = useAdmin()

    if (!isAdmin.value) return navigateTo({name: "login"})
})
