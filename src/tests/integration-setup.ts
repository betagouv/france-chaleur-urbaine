import { beforeAll, inject } from 'vitest';

import { getWorkerDatabaseUrl } from './integration-global-setup';

// Must run before any module creates the Kysely pool (it reads DATABASE_URL at import time)
process.env.DATABASE_URL = getWorkerDatabaseUrl(inject('templateDatabaseUrl'), process.env.VITEST_POOL_ID!);

// Every file starts from an empty database, whatever the template or the previous file of the worker left.
// Imported lazily so that the Kysely pool is created after DATABASE_URL is set.
beforeAll(async () => {
  const { cleanDatabase } = await import('./fixtures');
  await cleanDatabase();
});
