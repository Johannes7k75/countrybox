import type { User } from "~~/shared/types"
import { useAuthUser } from "./useAuthUser"

export const useAuth = () => {
  const authUser = useAuthUser()

  const setUser = (user: User | null) => {
    authUser.value = user
  }

  const login = async (email: string, password: string, rememberMe: boolean) => {
    const data = await $fetch<{user: User}>("/auth/login", {
      method: "POST",
      body: {
        email,
        password,
        rememberMe
      }
    })

    setUser(data.user)

    return authUser
  }

  const signup = async (email: string, password: string) => {
    const data = await $fetch<{user: User}>("/auth/signup",{
      method: "POST",
      body: {
        email,
        password
      }
    })

    setUser(data.user)

    return authUser
  }

  const logout = async () => {
    const data = await $fetch<{ user: User }>("/auth/logout", {
      method: "POST"
    })

    setUser(data.user)
  }

  const me = async () => {
    if (!authUser.value) {
      try {
        console.log(useRequestHeaders(["cookie"]))

        const data = await $fetch<{ user: User }>("/auth/me", {
          headers: useRequestHeaders(["cookie"])
        })

        setUser(data.user)
      } catch {
        setUser(null)
      }
    }

    return authUser
  }

  return { login, logout, signup, me }
}
