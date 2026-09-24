import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests', workers: 1, timeout: 30_000,
  use: {
    baseURL: 'http://127.0.0.1:4173', viewport: { width: 390, height: 844 },
    launchOptions: { executablePath: process.env.ROUNDR_BROWSER },
    trace: 'retain-on-failure',
  },
  webServer: { command: 'node scripts/serve-preview.cjs', url: 'http://127.0.0.1:4173', reuseExistingServer: !process.env.CI },
});

