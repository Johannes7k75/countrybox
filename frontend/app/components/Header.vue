<script lang="ts" setup>
import { type DropdownMenuItem } from "@nuxt/ui/runtime/components/DropdownMenu.vue"
import type { User } from "~~/shared/types";

const props = defineProps<{ user: User | null }>();

const { logout } = useAuth();

const isOpen = ref(false);

async function onLogout() {
  await logout();
  await navigateTo("/");
}

const dropdownItems = computed(() => {
  return [
      {
        label:useI18n().t("dropdown.account.settings"),
        icon: "mdi:cog-outline",
        onSelect() {
          isOpen.value = true
        }
      },
      {type: "separator"},
       props.user ?{
        label: useI18n().t("dropdown.account.logout"),
        icon: "mdi:logout",
        color: "error",
        onSelect() {
          onLogout()
        }
      }: {
        label: useI18n().t("dropdown.account.login"),
        icon: "mdi:login",
        color: "neutral",
        to: {
          path: "/login"
        }
      }
  ] as DropdownMenuItem[]
})

</script>

<template>
  <div class="flex h-14 w-full items-center border-b-[1px] border-solid border-white/10">
    <!-- px-[12%] py-2 max-2xl:px-[7%] max-lg:px-[20px] max-lg:py-[10px] -->

    <div class="relative ml-auto flex gap-2 mr-2">
      <LazyUDropdownMenu :items="dropdownItems">
        <UButton color="accent" :label="user?.email" trailing-icon="i-heroicons-chevron-down-20-solid" variant="subtle"
          class="text-(--text)" />
      </LazyUDropdownMenu>

      <SettingsModal v-model:model-value="isOpen" @update:model-value="(e) => (isOpen = e)" />
    </div>
  </div>
</template>
