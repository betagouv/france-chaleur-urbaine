import AxeBuilder from '@axe-core/playwright';
import type { Page, TestInfo } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Create an AxeBuilder pre-configured for WCAG 2.2 AA + best practices.
 */
export function createAxeBuilder(page: Page) {
  return new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
    .exclude('[class^="PostHogSurvey"]') // PostHog survey widget (third-party)
    .exclude('#fr-consent-banner'); // DSFR cookie consent banner
}

type AxeResults = Awaited<ReturnType<AxeBuilder['analyze']>>;

/**
 * Attach full axe results to the Playwright test report and assert no violations.
 */
export async function expectNoViolations(results: AxeResults, testInfo: TestInfo) {
  await testInfo.attach('accessibility-scan-results', {
    body: JSON.stringify(results, null, 2),
    contentType: 'application/json',
  });

  expect(results.violations).toEqual([]);
}
