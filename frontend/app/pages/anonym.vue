<script lang="ts" setup>

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
  </div>
</template>