import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 15_000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:3001',
    headless: true,
    browserName: 'chromium',
  },
  webServer: {
    command: 'bun run dev:e2e',
    port: 3001,
    reuseExistingServer: false,
    timeout: 15_000,
  },
});
