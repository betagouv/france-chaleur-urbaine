import { kdb } from '@/server/db/kysely';

/** Loads registered labels once per admin list, including archived integrations used by historical demands. */
export const getIntegrationLabels = async () =>
  Object.fromEntries(
    (await kdb.selectFrom('conversion_sources').select(['id', 'label']).execute()).map((source) => [source.id, source.label])
  );
