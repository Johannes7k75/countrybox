<script setup lang="ts">
const { fetch: refreshSession } = useUserSession();

const loading = ref(false);
const router = useRouter();

async function login(body: { email: string; password: string }) {
  loading.value = true;
  try {
    const res = await useFetch("/api/auth/login", {
      method: "POST",
      body,
    });
    console.log({ res });
    await refreshSession();
    await router.push({ path: "/" });
    loading.value = false;
  } catch (error) {
    console.log({ error });
    alert(error.statusMessage || error);
    loading.value = false;
  }
}
</script>

<template>
  <div class="mx-auto mt-20 flex w-80 max-w-full flex-col gap-4">
    <div class="rounded-md bg-gray-700/80 p-4">
      <AuthForm
        :loading="loading"
        @on-submit="login"
        :title="$t('auth.signin')"
      />
    </div>

    <div
      class="rounded-md border border-solid border-gray-500 py-4 text-center"
    >
      <p>
        {{ $t("auth.noAccount") }}
        <NuxtLink class="text-(--primary)" :to="{ name: 'signup' }"
          >{{ $t("auth.signup") }}
        </NuxtLink>
      </p>
    </div>
  </div>
</template>
