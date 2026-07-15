import path from 'node:path';

/**
 * Storage state (localStorage) with the DSFR cookie consent pre-set, produced by the
 * `consent.setup.ts` setup project. Tests load it via `use.storageState` so the consent banner
 * never appears. The Playwright MCP can reuse the same file with `--storage-state <this path>`.
 */
export const consentStorageState = path.join(process.cwd(), 'playwright/.auth/consent.json');
