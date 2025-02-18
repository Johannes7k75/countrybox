<template>

    
    <div class="w-full h-14 relative flex items-center bg-slate-500/70">
        <div class="ml-auto mr-2 relative group justify-center mt-1">
            <Icon name="mdi:account-circle-outline" size="3rem"/>
            <div class="absolute right-0 bg-gray-700 p-2 rounded-sm top-[3rem] hidden group-hover:flex flex-col gap-1 items-center" >
                <span class="ml-auto mr-2 h-min">{{ user?.email }}</span>
                <UButton color="red" label="Logout" @click="logout" class="px-2 py-1" v-show="loggedIn" />
            </div>
        </div>
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