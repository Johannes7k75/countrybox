import yaml from "@rollup/plugin-yaml";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },

  ssr: false,

  nitro: {
    experimental: {
      tasks: true,
    },
  },

  vite: {
    plugins: [yaml()],
  },

  css: ["@/assets/css/main.css"],

  modules: [
    "nuxt-auth-utils",
    "@nuxt/image",
    "@nuxt/ui",
    "@pinia/nuxt",
    "@nuxtjs/leaflet",
    "@nuxtjs/i18n",
  ],

  i18n: {
    vueI18n: "./i18n.config.ts",
  },

  tailwindcss: {
    exposeConfig: true,
    viewer: true,
    config: {
      theme: {
        extend: {
          aspectRatio: {
            auto: "auto",
            square: "1 / 1",
            video: "16 / 9",
          },
        },
      },
    },
  },

  icon: {
    serverBundle: {
      collections: ["uil", "mdi"],
    },
  },
});
