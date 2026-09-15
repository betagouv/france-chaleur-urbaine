import { defineTilesGenerationStrategy } from '@/modules/tiles/server/generation';
import { extractNDJSONFromDatabaseTable } from '@/modules/tiles/server/generation-strategies';
import { kdb, sql } from '@/server/db/kysely';

/**
 * Generate tiles for test addresses using streaming approach.
 */
export const testsAdressesGeoJSONQuery = defineTilesGenerationStrategy(async (context) => {
  const { logger } = context;

  logger.info('Creating temporary table for streaming extraction');

  await sql.raw('DROP TABLE IF EXISTS tests_adresses_tiles_features').execute(kdb);

  await sql
    .raw(
      `
    CREATE UNLOGGED TABLE tests_adresses_tiles_features AS
    WITH addresses AS (
      SELECT
        addr.ban_address,
        ST_Centroid(ST_Collect(addr.geom)) as geom,
        -- one feature per address: keep the most recently computed eligibility
        (array_agg(addr.eligibility_history->-1->'eligibility' ORDER BY (addr.eligibility_history->-1->>'calculated_at')::timestamptz DESC))[1] AS eligibility,
        count(DISTINCT u.id)::int AS nb_users,

        json_agg(
          DISTINCT jsonb_build_object(
            'test_id', t.id,
            'test_name', t.name,
            'test_created_at', t.created_at,
            'user_id', u.id,
            'user_role', u.role,
            'user_first_name', u.first_name,
            'user_last_name', u.last_name,
            'user_structure_name', u.structure_name,
            'user_structure_type', u.structure_type,
            'user_phone', u.phone
          )
        ) AS tests

      FROM pro_eligibility_tests_addresses addr
      LEFT JOIN pro_eligibility_tests t ON addr.test_id = t.id
      LEFT JOIN users u ON t.user_id = u.id

      WHERE addr.ban_address IS NOT NULL
        AND addr.ban_score > 60
        AND jsonb_array_length(addr.eligibility_history) > 0

      GROUP BY addr.ban_address
    )
    SELECT
      row_number() OVER () as id,
      ban_address,
      geom,
      eligibility,
      (eligibility->>'eligible')::boolean as eligible,
      nb_users,
      tests
    FROM addresses
  `
    )
    .execute(kdb);

  logger.info('Starting chunked extraction');

  const result = await extractNDJSONFromDatabaseTable('tests_adresses_tiles_features', {
    chunkSize: 10000,
    fields: ['id', 'ban_address', 'geom', 'eligibility', 'eligible', 'nb_users', 'tests'],
    idField: 'id',
  })(context);

  logger.info('Extraction complete');
  return result;
});
