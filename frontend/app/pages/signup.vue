<script setup lang="ts">
import { FetchError } from "ofetch";

definePageMeta({
  middleware: ["guest-only"],
});

defineRouteRules({
  prerender: true
})

const { signup } = useAuth();

const loading = ref(false);

async function onSignup({email, password}: {email: string, password: string}) {
  loading.value = true;
  try {
    await signup(email, password);

    await navigateTo({ name: "index" });
  } catch (error) {
    console.error(error);
    if (!(error instanceof FetchError)) {
      throw error;
    }

    useToast().add({
      title: "Error on signup",
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
      <AuthForm
        :loading="loading"
        @on-submit="onSignup"
        :title="$t('auth.signup')"
        repeat-password
      />
    </div>
    <div
      class="rounded-md border border-solid border-gray-500 py-4 text-center"
    >
      <p>
        {{ $t("auth.alreadyAccount") }}
        <NuxtLink class="text-(--primary)" :to="{ name: 'login' }"
          >{{ $t("auth.signin") }}
        </NuxtLink>
      </p>
    </div>
  </div>
</template>
