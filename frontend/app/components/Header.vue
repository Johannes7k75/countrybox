<script lang="ts" setup>
import type { User } from "~~/shared/types";

defineProps<{ user: User | null }>();

const { logout } = useAuth();

const isOpen = ref(false);

async function onLogout() {
  await logout();
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
  <div
    class="flex h-14 w-full items-center border-b-[1px] border-solid border-white/10"
  >
    <!-- px-[12%] py-2 max-2xl:px-[7%] max-lg:px-[20px] max-lg:py-[10px] -->

    <div class="relative mr-2 ml-auto">
      <template v-if="user">
        <UPopover v-model:open="popoverHover">
          <UButton
            color="accent"
            :label="user?.email"
            trailing-icon="i-heroicons-chevron-down-20-solid"
            variant="subtle"
            class="text-(--text)"
            aria-haspopup="true"
            @mouseover="hoverPopover"
            @mouseleave="closePopover"
            @touch="hoverPopover"
          />

          <template #content>
            <div
              class="flex flex-col p-2"
              @mouseover="hoverPopover"
              @mouseleave="closePopover"
            >
              <UButton
                :label="$t('dropdown.account.settings')"
                @click="isOpen = true"
                class="cursor-pointer !bg-transparent font-bold !text-white"
              />
              <USeparator />

              <UButton
                v-if="user"
                :label="$t('dropdown.account.logout')"
                color="error"
                @click="onLogout"
                class="cursor-pointer !bg-transparent font-bold !text-red-600"
              />

              <UButton
                v-else-if="!user"
                :label="$t('dropdown.account.login')"
                class="cursor-pointer !bg-transparent font-bold !text-white"
                @click="useRouter().push({ name: 'login' })"
              />
            </div>
          </template>
        </UPopover>

        <SettingsModal
          v-model:model-value="isOpen"
          @update:model-value="(e) => (isOpen = e)"
        />
      </template>
      <template v-else>
        <UButton
          :label="$t('auth.signin')"
          class="px-4 py-2"
          :to="{ path: '/login' }"
        />
        <UButton
          :label="$t('auth.signup')"
          class="ml-4 px-4 py-2 text-(--text)"
          variant="outline"
          :to="{ path: '/signup' }"
        />
      </template>
    </div>
  </div>
</template>
