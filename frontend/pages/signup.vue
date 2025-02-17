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
const isValid = computed(() => secondPassword.value === credentials.password)

</script>

<template>

    <div class="max-w-[600px] w-[50vw] bg-slate-500 rounded-md p-4 h-max">
        <form @submit.prevent="signup" class="flex flex-col gap-2">
            <input v-model="credentials.email" type="email" placeholder="Email" />
            <input v-model="credentials.password" type="password" placeholder="Password" />
            <input v-model="secondPassword" type="password" placeholder="Password" />
            <button type="submit" :disabled="!isValid" class="w-full py-1 bg-slate-800 rounded-md">Create</button>
        </form>
    </div>

</template>