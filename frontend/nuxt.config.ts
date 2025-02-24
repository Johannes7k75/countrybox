import yaml from "@rollup/plugin-yaml";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },

  ssr: false,

  srcDir: "app",
  serverDir: "server",

  nitro: {
    experimental: {
      tasks: true,
    },
  },

  vite: {
    plugins: [yaml()],
    server: {
      allowedHosts: ["dev.country.jospace.de"],
    },
  },

  css: ["~/assets/css/main.css"],

  modules: [
    "@nuxt/ui",
    "nuxt-auth-utils",
    "@nuxt/image",
    "@pinia/nuxt",
    "@nuxtjs/leaflet",
    "@nuxtjs/i18n",
  ],

  i18n: {
    vueI18n: "./i18n/i18n.config.ts",
  },

  ui: {
    devtools: { enabled: true },
    colorMode: true,
    theme: {
      colors: ["primary", "secondary","accent","background"],
    }
  },

  icon: {
    serverBundle: {
      collections: ["uil", "mdi"],
    },
  },
});
