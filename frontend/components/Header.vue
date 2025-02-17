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
        <span class="ml-auto mr-2 h-min">{{ user?.email }}</span>
  </div>
</template>

<script lang="ts" setup>
const {user} = useUserSession()
</script>

<style>

</style>