import { defineConfig } from 'vitest/config'
// Plain Node tests (no Nuxt runtime) — e.g. message catalogue integrity.
export default defineConfig({ test: { include: ['test/**/*.test.ts'] } })
