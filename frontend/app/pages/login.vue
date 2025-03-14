<script setup lang="ts">
import { FetchError } from "ofetch";

definePageMeta({
  middleware: ["guest-only"],
});

defineRouteRules({
  prerender: true,
});

const { login } = useAuth();
const { add } = useToast();

const loading = ref(false);

async function onLogin({ email, password }: { email: string; password: string }) {
  loading.value = true;
  try {
    await login(email, password, false);

    await navigateTo({ name: "index" });
  } catch (error) {
    console.error(error);
    if (!(error instanceof FetchError)) {
      throw error;
    }

    add({
      title: "Error on login",
      description: error.data?.message ?? error.statusMessage ?? error.message,
      color: "error",
    });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="mx-auto mt-20 flex w-80 max-w-full flex-col gap-4">
      <div class="rounded-md bg-gray-700/80 p-4">

        <AuthForm :loading="loading" @on-submit="onLogin" :title="$t('auth.signin')"/>
      </div>

      <div class="rounded-md border border-solid border-gray-500 py-4 text-center">
        <p>
          {{ $t("auth.noAccount") }}
          <NuxtLink class="text-(--primary)" :to="{ name: 'signup' }">{{ $t("auth.signup") }} </NuxtLink>
        </p>

      </div>
  </div>
</template>
