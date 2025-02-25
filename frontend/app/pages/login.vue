<script setup lang="ts">
import { FetchError } from "ofetch";

definePageMeta({
  middleware: ["guest-only"],
})

const {login} = useAuth()

const loading = ref(false);

async function onLogin({email, password}:{email: string, password: string}) {
  loading.value = true;
  try {
    await login(email,password, false)

    await navigateTo({name: "index"})
  } catch(error) {
    console.error(error)
    if (!(error instanceof FetchError)) {
      throw error
    }

    useToast().add({
      title: "Error on login",
      description: error.statusMessage,
      color: "error",
    });
  } finally {
    loading.value = false
  }
}

// async function login(body: { email: string; password: string }) {
//   loading.value = true;
//   try {
//     const res = await useFetch("/auth/login", {
//       method: "POST",
//       body,
//     });
//     console.log({ res });
//     await refreshSession();
//     await router.push({ path: "/" });
//     loading.value = false;
//   } catch (error) {
//     if (error instanceof FetchError) {
//       useToast().add({
//         title: "Error on login",
//         description: error.statusMessage,
//         color: "error",
//       });
//     } else {
//       useToast().add({
//         title: "Error on login",
//         description: `${error}`,
//         color: "error",
//       });
//     }
//     loading.value = false;
//   }
// }
</script>

<template>
  <div class="mx-auto mt-20 flex w-80 max-w-full flex-col gap-4">
    <div class="rounded-md bg-gray-700/80 p-4">
      <AuthForm
        :loading="loading"
        @on-submit="onLogin"
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
