<script setup lang="ts">
import { GameLink } from '#components';

definePageMeta({
  middleware: ['authenticated'],
})

const { user, clear: clearSession } = useUserSession()

async function logout() {
  await clearSession()
  await navigateTo('/login')
}

</script>

<template>
  <div>
    <h1>Welcome {{ user.name }}</h1>
    <button @click="logout">Logout</button>
  </div>

  <div class="flex items-center flex-col">
    <ul class="flex items-center flex-col gap-4 w-max">
      <GameLink to="/game" name="Flaggen" sub-name="Spiel" />
      
      <GameLink to="/flags" name="Klicken und lernen" sub-name="Üben" />
    </ul>
  </div>
</template>
