<script setup lang="ts">
const { loggedIn, user, fetch: refreshSession } = useUserSession();

const loading = ref(false);
const router = useRouter();

async function signup(body: { email: string; password: string }) {
  loading.value = true;
  try {
    await useFetch("/api/signup", {
      method: "POST",
      body,
    });
    await refreshSession();
    await router.push({ name: "/" });
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
        @on-submit="signup"
        :title="$t('auth.signup')"
        repeat-password
      />
    </div>
    <div
      class="rounded-md border border-solid border-gray-500 py-4 text-center"
    >
      <p>
        {{ $t("auth.alreadyAccount") }}
        <NuxtLink class="text-green-400" :to="{ name: 'login' }"
          >{{ $t("auth.signin") }}
        </NuxtLink>
      </p>
    </div>
  </div>
</template>
