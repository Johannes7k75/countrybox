// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  ssr: false,

  nitro: {
    experimental: {
      tasks: true,
    }
  },

  css: ["@/assets/css/main.css"],

  modules: [
    "nuxt-auth-utils",
    "@nuxtjs/tailwindcss",
    "@nuxt/image",
    "@nuxt/icon",
    "@nuxt/ui"
  ],

  tailwindcss: {
    exposeConfig: true,
    viewer: true
  },

  icon: {
    serverBundle: {
      collections: ["uil", "mdi"]
    }
  }
})