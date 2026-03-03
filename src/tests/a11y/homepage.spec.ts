import { test } from '@playwright/test';

import { createAxeBuilder, expectNoViolations } from './axe-test';

test.describe('Homepage accessibility', () => {
  test('should not have any automatically detectable WCAG 2.2 AA violations', async ({ page }, testInfo) => {
    await page.goto('/');
    await page.locator('main').waitFor();

    const results = await createAxeBuilder(page).analyze();

    await expectNoViolations(results, testInfo);
  });
});
