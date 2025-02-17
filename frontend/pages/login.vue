<script setup lang="ts">
const { loggedIn, user, fetch: refreshSession } = useUserSession()

if (loggedIn.value) {
  window.location.href = "/"
  await navigateTo("/")
}

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
</script>

<template>

  <div class="w-96 bg-gray-500 h-max p-4 rounded-md">
    <form @submit.prevent="login" class="flex flex-col gap-2">
      <input v-model="credentials.email" type="email" placeholder="Email" />
      <input v-model="credentials.password" type="password" placeholder="Password" />
      <button type="submit" class="w-full py-1 bg-green-500 rounded-md">Login</button>
    </form>
  </div>
</template>
