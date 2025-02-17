<template>

    
    <div class="w-full h-14 relative flex items-center bg-slate-500/70">
        <UPopover>
            <UButton color="white" label="Open" trailing-icon="i-heroicons-chevron-down-20-solid" />
    
            <template #panel>
                <div class="p-4 bg-red-500 rounded-md">
                    Test
                </div>
            </template>
        </UPopover>

        <UButton color="red" label="Logout" @click="logout" class="px-2 py-1" v-show="loggedIn">
            
        </UButton>

        <span class="ml-auto mr-2 h-min">{{ user?.email }}</span>
  </div>
</template>

<script lang="ts" setup>
const {user, clear: clearSession, loggedIn} = useUserSession()

async function logout() {
    await clearSession()
    window.location.reload()
}
</script>

<style>

</style>