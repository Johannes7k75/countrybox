<script lang="ts" setup>
const { user, clear: clearSession, loggedIn } = useUserSession();
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

    <div class="w-full h-14 flex items-center border-b-[1px] border-solid border-white/10 py-2 px-[12%] max-2xl:px-[7%] max-lg:px-[20px] max-lg:py-[10px]">
        <div class="ml-auto mr-2 relative">
            <UPopover v-model:open="popoverHover">
                <UButton color="accent" :label="user?.email" trailing-icon="i-heroicons-chevron-down-20-solid"  variant="subtle" class="text-(--text)"
                    aria-haspopup="true" @mouseover="hoverPopover" @mouseleave="closePopover" />

                <template #content>
                    <div class="p-2 flex flex-col " @mouseover="hoverPopover" @mouseleave="closePopover">
                        <UButton :label="$t('dropdown.account.settings')"
                            @click="isOpen = true"
                            class="!bg-transparent !text-white font-bold cursor-pointer" />
                        <USeparator />

                        <UButton v-if="loggedIn" :label="$t('dropdown.account.logout')" color="red" @click="logout"
                            class="!bg-transparent !text-red-600 font-bold cursor-pointer" />

                        <UButton v-else-if="!loggedIn" :label="$t('dropdown.account.login')"
                            class="!bg-transparent !text-white font-bold cursor-pointer"
                            @click="useRouter().push({ name: 'login' })" />
                    </div>
                </template>
            </UPopover>

            <SettingsModal v-model:model-value="isOpen" @update:model-value="e=>isOpen=e"/>
        </div>
    </div>

</template>
