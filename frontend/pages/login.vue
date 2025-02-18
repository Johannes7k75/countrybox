<script setup lang="ts">
import { cn } from '~/lib/utils'

const { fetch: refreshSession } = useUserSession()

const credentials = reactive({
  email: '',
  password: '',
})

async function login() {
  $fetch('/api/login', {
    method: 'POST',
    body: credentials
  })
    .then(async () => {
      // Refresh the session on client-side and redirect to the home page
      await refreshSession()
      await navigateTo('/')
    })
    .catch(() => alert('Bad credentials'))
}

const isValid = computed(() => credentials.email != "" && credentials.password != "")

</script>

<template>

  <div class="flex h-full">
    <div class="w-96 bg-gray-700 h-max p-4 rounded-sm mx-auto my-auto">
      <form @submit.prevent="login" class="flex flex-col gap-4">

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

        <button type="submit" class="w-full py-1 bg-green-500 rounded-sm" :class="cn(!isValid && 'opacity-50')"
          :disabled="!isValid">
          Login
        </button>

        <span class="mx-auto">Don't have an account? <a href="/signup" class="text-green-400">Create One</a></span>
      </form>
    </div>
  </div>
</template>
