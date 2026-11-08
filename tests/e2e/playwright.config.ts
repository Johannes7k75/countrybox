import { defineConfig, devices } from '@playwright/test'
// BASE_URL: dev (pnpm dev:web + dev:api) http://localhost:3000, or the compose stack http://localhost:8088
// CHROMIUM_PATH: optional system Chromium (otherwise run `npx playwright install chromium`).
const launchOptions = process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}
export default defineConfig({
  testDir: '.',
  timeout: 60_000,
  fullyParallel: false,
  reporter: [['list']],
  use: { baseURL: process.env.BASE_URL ?? 'http://localhost:3000', trace: 'retain-on-failure', launchOptions },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 }, launchOptions } },
    { name: 'mobile', use: { ...devices['Pixel 7'], launchOptions }, testMatch: /guest/ },
  ],
})
