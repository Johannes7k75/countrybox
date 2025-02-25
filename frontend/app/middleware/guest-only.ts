import { useAuthUser } from "~/composables/useAuthUser"

export default defineNuxtRouteMiddleware((to, from) => {
    const user = useAuthUser()

    if (user.value?.email!=undefined) {
        if (import.meta.server) return navigateTo({name: "index"})
        
        return abortNavigation()
    }

})
