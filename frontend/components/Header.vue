<script lang="ts" setup>
const { user, clear: clearSession } = useUserSession();
const isOpen = ref(false);

async function logout() {
    await clearSession();
    await navigateTo("/");
}

const popoverHover = ref(false);
const popoverTimeout = ref();

const hoverPopover = () => {
    popoverHover.value = true;
    if (popoverTimeout.value) clearTimeout(popoverTimeout.value);
};

const closePopover = () => {
    popoverTimeout.value = setTimeout(() => {
        popoverHover.value = false;
    }, 150);
};

</script>

<template>
    <div class="w-full h-14 flex items-center bg-black/60">
        <div class="ml-auto mr-2 relative">
            <UPopover v-model:open="popoverHover" :popper="{ placement: 'bottom', strategy: 'absolute' }">
                <UButton color="white" :label="user?.email" trailing-icon="i-heroicons-chevron-down-20-solid"
                    aria-haspopup="true" @mouseover="hoverPopover" @mouseleave="closePopover" />

                <template #panel>
                    <div class="p-2 flex flex-col " @mouseover="hoverPopover" @mouseleave="closePopover">
                        <UButton :label="$t('dropdown.account.settings')" @click="isOpen = true"
                            class="!bg-transparent !text-white font-bold" />
                        <UDivider />
                        <UButton :label="$t('dropdown.account.logout')" color="red" @click="logout"
                            class="!bg-transparent !text-red-600 font-bold" />
                    </div>
                </template>
            </UPopover>

            <SettingsModal v-model="isOpen" />
        </div>
    </div>
</template>
