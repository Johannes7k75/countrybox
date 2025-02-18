<script lang="ts" setup>
const { user, clear: clearSession } = useUserSession();

const isOpen = ref(false);

async function logout() {
    await clearSession()
    await navigateTo("/")
}

</script>

<template>
    <div class="w-full h-14 relative flex items-center bg-slate-500/70">
        <div class="ml-auto mr-2 relative group justify-center ">
            <!-- <UButton color="white" :label="user?.email" trailing-icon="i-heroicons-user-circle" @click="isOpen = true" /> -->
            
            <UPopover mode="hover" >
                <UButton color="white" :label="user?.email" trailing-icon="i-heroicons-chevron-down-20-solid"/>

                <template #panel>
                    <div class="p-2 flex flex-col">
                        <UButton label="Einstellungen" @click="isOpen = true" class="!bg-transparent !text-white font-bold" />
                        <UDivider/>
                        <UButton label="Ausloggen" color="red" @click="logout" class="!bg-transparent !text-red-600 font-bold" />

                    </div>
                </template>

            </UPopover>

            <SettingsModal v-model="isOpen" @update:model-value="(val)=>isOpen=val" />
        </div>
    </div>
</template>
