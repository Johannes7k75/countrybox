<script>
import "~/assets/css/tailwind.css";
</script>

<template>
  <UApp>
    <div class="h-screen max-h-full w-screen">
      <slot />
    </div>
  </UApp>
</template>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
</style>
