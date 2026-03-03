import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  forbidOnly: !!process.env.CI,
  fullyParallel: true,
  outputDir: './test-results/a11y',

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  reporter: [['html', { open: 'never', outputFolder: './test-results/a11y-report' }], ['list']],
  retries: process.env.CI ? 1 : 0,
  testDir: './src/tests/a11y',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  webServer: {
    command: 'pnpm dev',
    reuseExistingServer: true,
    timeout: 120_000,
    url: 'http://localhost:3000',
  },
  workers: process.env.CI ? 1 : undefined,
});
