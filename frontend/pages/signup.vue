<script setup lang="ts">
import { cn } from '~/lib/utils'

const { loggedIn, user, fetch: refreshSession } = useUserSession()

const credentials = reactive({
    email: '',
    password: '',
})

async function signup() {
    $fetch("/api/signup", {
        method: "POST",
        body: credentials
    }).then(async () => {
        await refreshSession()
        await navigateTo("/")
    })
        .catch(() => alert("Bad credentials"))
}

const secondPassword = ref("")
const isValid = computed(() => secondPassword.value === credentials.password && credentials.password != "" && credentials.email != "")

</script>

<template>
    <div class="flex h-full">
        <div class="w-96 bg-gray-700 h-max p-4 rounded-sm mx-auto my-auto">
            <form @submit.prevent="signup" class="flex flex-col gap-4">

                <div class="flex flex-col">
                    <label for="email">Email</label>
                    <input v-model="credentials.email" name="email" type="email" placeholder="john@exmaple.com"
                        class="bg-transparent rounded-sm border border-gray-600/70 pl-2" />
                </div>

                <div class="flex flex-col">
                    <label for="password">Password</label>
                    <input v-model="credentials.password" name="password" type="password" placeholder="Password"
                        class="bg-transparent rounded-sm border border-gray-600/70 pl-2" />
                </div>

                <div class="flex flex-col">
                    <label for="password">Repeat password</label>
                    <input v-model="secondPassword" name="password" type="password" placeholder="Password"
                        class="bg-transparent rounded-sm border border-gray-600/70 pl-2" />
                </div>

                <button type="submit" class="w-full py-1 bg-green-500 rounded-sm" :class="cn(!isValid && 'opacity-50')"
                    :disabled="!isValid">
                    Signup
                </button>

                <span class="mx-auto">Already have an account? <a href="/login" class="text-green-400">Login</a></span>
            </form>
        </div>
    </div>

</template>