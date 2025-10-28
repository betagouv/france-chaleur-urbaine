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
    SELECT
      row_number() OVER () as id,
      addr.ban_address,
      ST_Centroid(ST_Collect(addr.geom)) as geom,
      (addr.eligibility_history->-1->'eligibility') AS eligibility,
      (addr.eligibility_history->-1->'eligibility'->>'eligible')::boolean as eligible,

      json_agg(
        DISTINCT jsonb_build_object(
          'test_id', t.id,
          'test_name', t.name,
          'test_created_at', t.created_at,
          'user_id', u.id,
          'user_role', u.role,
          'user_gestionnaires', u.gestionnaires,
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

    GROUP BY addr.ban_address, addr.eligibility_history
  `
    )
    .execute(kdb);

  logger.info('Starting chunked extraction');

  const result = await extractNDJSONFromDatabaseTable('tests_adresses_tiles_features' as any, {
    chunkSize: 10000,
    fields: ['id', 'ban_address', 'geom', 'eligibility', 'eligible', 'tests'],
    idField: 'id',
  })(context);

  logger.info('Extraction complete');
  return result;
});
