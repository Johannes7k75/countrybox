import ViteYaml from "@modyfi/vite-plugin-yaml";

const ONE_DAY = 60 * 60 * 24 * 1000;
const ONE_WEEK = ONE_DAY * 7;

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },

  ssr: false,

  future: {
    compatibilityVersion: 4,
  },

  runtimeConfig: {
    cookieName: "__session",
    cookieSecret: "secret",
    cookieExpires: ONE_DAY.toString(),
    cookieRememberMeExpires: ONE_WEEK.toString(),
  },

  nitro: {
    experimental: {
      tasks: true,
    },
  },

  vite: {
    plugins: [ViteYaml()],
    server: {
      allowedHosts: ["dev.country.jospace.de"],
    },
  },

  css: ["~/assets/css/main.css"],

  modules: [// "nuxt-auth-utils",
  "@nuxt/ui", "@nuxt/image", "@pinia/nuxt", "@nuxtjs/leaflet", "@nuxtjs/i18n", "@vueuse/nuxt"],

  i18n: {
    vueI18n: "./i18n/i18n.config.ts",
  },

  ui: {
    devtools: { enabled: true },
    colorMode: true,
    theme: {
      colors: [
        "primary",
        "secondary",
        "accent",
        "background",
        "info",
        "success",
        "warning",
        "error",
      ],
    },
  },

  icon: {
    serverBundle: {
      collections: ["uil", "mdi"],
    },
  },
});