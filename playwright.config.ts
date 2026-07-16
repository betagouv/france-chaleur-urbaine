import { defineConfig, devices } from '@playwright/test';

import { consentStorageState } from './src/tests/a11y/consent-state';

export default defineConfig({
  forbidOnly: !!process.env.CI,
  fullyParallel: true,
  outputDir: './test-results/a11y',

  projects: [
    // Accepts the DSFR cookie banner once and saves it as a storageState (see consent.setup.ts).
    { name: 'setup', testMatch: /consent\.setup\.ts/ },
    {
      dependencies: ['setup'],
      name: 'a11y',
      testDir: './src/tests/a11y',
      use: { ...devices['Desktop Chrome'], storageState: consentStorageState },
    },
    {
      dependencies: ['setup'],
      name: 'e2e',
      // Tests e2e co-localisés dans les modules, identifiés par le suffixe *.e2e.spec.ts
      testDir: './src',
      testMatch: '**/*.e2e.spec.ts',
      use: { ...devices['Desktop Chrome'], storageState: consentStorageState },
    },
  ],
  reporter: [['html', { open: 'never', outputFolder: './test-results/a11y-report' }], ['list']],
  retries: process.env.CI ? 1 : 0,
  testDir: './src',

  use: {
    baseURL: 'http://localhost:3010',
    trace: 'on-first-retry',
  },

  webServer: {
    // Port dédié aux tests, géré par Playwright — évite tout conflit avec le serveur de dev (:3000)
    command: 'pnpm dev -p 3010',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    url: 'http://localhost:3010',
  },
  workers: process.env.CI ? 1 : undefined,
});
