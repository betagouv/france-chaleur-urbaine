import { describe, expect, it } from 'vitest';

import { buildDocSearchDocuments } from './commands/build-search-index';
import { docSearchDocuments } from './search-index.generated';

describe('doc search index', () => {
  // Rebuild from the MDX and compare: a stale generated index reddens the build.
  it('is up to date (run `pnpm doc:build-search-index` if this fails)', () => {
    expect(docSearchDocuments).toEqual(buildDocSearchDocuments());
  });
});
