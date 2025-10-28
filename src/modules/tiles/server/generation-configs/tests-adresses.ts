import { defineTilesGenerationStrategy } from '@/modules/tiles/server/generation';
import { extractNDJSONFromDatabaseTable } from '@/modules/tiles/server/generation-strategies';
import { kdb, sql } from '@/server/db/kysely';

/**
 * Generate tiles for test addresses using streaming approach (same as bdnb-batiments).
 * Uses a materialized view that can be chunked by ID, exactly like a real table.
 */
export const testsAdressesGeoJSONQuery = defineTilesGenerationStrategy(async (context) => {
  const { logger } = context;

  // Create a MATERIALIZED VIEW (cached table) with pre-aggregated data
  // This allows ogr2ogr to chunk by ID, exactly like bdnb-batiments does
  logger.info('Creating/refreshing materialized view for streaming');

  await sql
    .raw(
      `
    CREATE MATERIALIZED VIEW IF NOT EXISTS tests_adresses_tiles_mat AS
    SELECT
      row_number() OVER () as id,
      addr.ban_address,
      -- Merge geometries and transform to WGS84
      ST_Transform(ST_Centroid(ST_Collect(addr.geom)), 4326) as geom,
      -- Get the eligibility from the last item in eligibility_history
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

  // Refresh the materialized view to get latest data
  logger.info('Refreshing materialized view data');
  await sql.raw('REFRESH MATERIALIZED VIEW tests_adresses_tiles_mat').execute(kdb);

  // Now use extractNDJSONFromDatabaseTable exactly like bdnb-batiments does!
  // The materialized view acts like a real table with an 'id' column
  logger.info('Starting chunked extraction (same as bdnb-batiments)');

  const result = await extractNDJSONFromDatabaseTable('tests_adresses_tiles_mat' as any, {
    chunkSize: 10000, // Same as bdnb default
    fields: ['id', 'ban_address', 'geom', 'eligibility', 'eligible', 'tests'],
    idField: 'id',
  })(context);

  logger.info('Extraction complete');
  return result;
});
