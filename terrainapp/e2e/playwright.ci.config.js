// terrainapp/e2e/playwright.ci.config.js
import { defineConfig, devices } from '@playwright/test';
import base from './playwright.config.js';

export default defineConfig({
  ...base,
  // CI will start servers itself, prevent Playwright from trying to manage ports.
  webServer: undefined,

  // Force single worker in CI 
  workers: 1,

  // Keep your existing defaults
  use: {
    ...base.use,
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});