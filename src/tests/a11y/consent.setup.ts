import { test as setup } from '@playwright/test';

import { consentStorageState } from './consent-state';

/**
 * Dismisses the DSFR cookie banner once and persists the resulting localStorage as a storageState.
 * Runs as a `setup` project dependency so every test (and the Playwright MCP) starts without the banner.
 *
 * We click "Tout refuser": it hides the banner without loading the consent-gated third-party embeds
 * (YouTube player, Google/Hotjar/LinkedIn tags) that would otherwise inject their own a11y violations.
 */
setup('dismiss cookie banner', async ({ page }) => {
  await page.goto('/');
  const refuse = page.getByRole('button', { name: 'Tout refuser' });
  await refuse.click();
  // "Tout refuser" triggers a location.reload() (consentCallback); wait for the banner to be gone.
  await refuse.waitFor({ state: 'hidden' });
  await page.context().storageState({ path: consentStorageState });
});
