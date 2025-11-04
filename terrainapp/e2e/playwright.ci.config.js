// terrainapp/e2e/playwright.ci.config.js
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,       // keep deterministic in CI
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: 1,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:5173', // started by the workflow
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  // CRITICAL: do not let Playwright manage servers in CI
  webServer: [],
});