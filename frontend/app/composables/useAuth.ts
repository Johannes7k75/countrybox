import type { User } from "~~/shared/types"
import { useAuthUser } from "./useAuthUser"

export const useAuth = () => {
  const authUser = useAuthUser()

  const authApi =  useApi().fetch.create({
    baseURL: "/api/v3/auth"
  })

  const setUser = (user: User | null) => {
    authUser.value = user
  }

  const login = async (email: string, password: string, rememberMe: boolean) => {
    const data = await authApi<User>("/login", {
      method: "POST",
      credentials: 'include',
      body: {
        email,
        password,
        rememberMe
      }
    })

    setUser(data)

    return authUser
  }

  const signup = async (email: string, password: string) => {
    const data = await authApi<User>("/signup", {
      method: "POST",
      body: {
        email,
        password
      }
    })

    setUser(data)

    return authUser
  }

  const logout = async () => {
    const data = await authApi<User>("/logout", {
      method: "POST"
    })

    setUser(data)
  }

  const me = async () => {
    if (!authUser.value) {
      try {
        const data = await authApi<User>("/me", {
          headers: useRequestHeaders(["cookie"])
        })

        setUser(data)
      } catch {
        setUser(null)
      }
    }

    return authUser
  }

  return { login, logout, signup, me }
}
