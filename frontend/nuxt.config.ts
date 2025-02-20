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
    "@nuxt/image",
    "@nuxt/ui",
    "@pinia/nuxt",
    "@nuxtjs/leaflet"
  ],

  tailwindcss: {
    exposeConfig: true,
    viewer: true,
    config: {
      theme: {
        extend: {
          aspectRatio: {
            "auto": "auto",
            square: "1 / 1",
            video: "16 / 9"
          }
        }
      }
    }
  },

  icon: {
    serverBundle: {
      collections: ["uil", "mdi"]
    }
  }
})