<script setup lang="ts">
const { loggedIn, user, fetch: refreshSession } = useUserSession()

const loading = ref(false)
const router = useRouter()

async function signup(body: { email: string, password: string }) {
    loading.value = true
    try {
        await useFetch("/api/signup", {
            method: "POST",
            body
        })
        await refreshSession()
        await router.push({ name: "/" })
        loading.value = false
    } catch (error) {
        console.log({ error })
        alert(error.statusMessage || error)
        loading.value = false
    }
}
</script>

<template>
    <div class="w-80 max-w-full mx-auto flex flex-col gap-4 mt-20">
        <div class="bg-gray-700/80 p-4 rounded-md">
            <AuthForm :loading="loading" @on-submit="signup" :title="$t('auth.signup')" repeat-password />
        </div>
        <div class="border border-solid border-gray-500 rounded-md py-4 text-center">
            <p>{{ $t("auth.alreadyAccount") }} <NuxtLink class="text-green-400" :to="{ name: 'login' }">{{
                $t('auth.signin') }}
                </NuxtLink>
            </p>
        </div>
    </div>
</template>