// Static client app: `nuxt generate` emits files that Caddy serves; Hono owns every /api route.
export default defineNuxtConfig({
  compatibilityDate: '2026-11-01',
  ssr: false,
  devtools: { enabled: false },
  telemetry: false,
  modules: ['@nuxtjs/i18n'],
  // Messages live in i18n/locales/<code>.json. The locale comes from the learner's preference (usePrefs), not the URL.
  i18n: {
    strategy: 'no_prefix',
    defaultLocale: 'en',
    detectBrowserLanguage: false,
    locales: [
      { code: 'en', language: 'en-GB', name: 'English', file: 'en.json' },
      { code: 'de', language: 'de-DE', name: 'Deutsch', file: 'de.json' },
    ],
  },
  css: [
    '@fontsource-variable/fraunces/opsz.css',
    '@fontsource-variable/fraunces/opsz-italic.css',
    '@fontsource-variable/instrument-sans/index.css',
    '@fontsource/jetbrains-mono/400.css',
    '@fontsource/jetbrains-mono/500.css',
    '~/assets/styles/main.css',
  ],
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'CountryBox',
      meta: [
        { name: 'viewport', content: 'width=device-width,initial-scale=1,viewport-fit=cover' },
        {
          name: 'description',
          content: 'CountryBox — a field atlas for learning flags, capitals, domains and calling codes.',
        },
        { name: 'theme-color', content: '#f5f2ea', media: '(prefers-color-scheme: light)' },
        { name: 'theme-color', content: '#0e1420', media: '(prefers-color-scheme: dark)' },
      ],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    },
  },
  typescript: { strict: true },
  vite: {
    // Pre-bundle client deps up front so the dev server does not reload the page on first use.
    optimizeDeps: { include: ['better-auth/client/plugins', 'better-auth/vue', 'hono/client'] },
  },
  nitro: {
    devProxy: { '/api': { target: 'http://127.0.0.1:8787/api', changeOrigin: true } },
  },
})
