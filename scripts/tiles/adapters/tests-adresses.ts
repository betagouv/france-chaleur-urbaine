import { unlink, writeFile } from 'fs/promises';

import { kdb, sql } from '@/server/db/kysely';

import { BaseAdapter } from '../base';
export default class TestsAdressesAdapter extends BaseAdapter {
  public databaseName = 'pro_eligibility_tests_addresses';
  public zoomMin: number = 6;
  public zoomMax: number = 16;

  async generateGeoJSON(filepath?: string) {
    const filepathToExport = filepath || `/tmp/${this.databaseName}.geojson`;
    await unlink(filepathToExport).catch(() => {});

    const result = await sql<any>`
SELECT json_build_object(
  'type', 'FeatureCollection',
  'features', json_agg(feature)
)
FROM (
  SELECT json_build_object(
    'id', a.ban_address,
    'type', 'Feature',
    'geometry', ST_AsGeoJSON(ST_ForcePolygonCCW(ST_Transform(ST_Centroid(ST_Collect(a.geom)), 4326)))::json,
    'properties', jsonb_build_object(
      'ban_address', a.ban_address,
      'tests', a.tests,
      'eligibility_status', a.eligibility_status,
      'isEligible', (a.eligibility_status->>'isEligible')::boolean
    )
  ) AS feature
  FROM (
    SELECT
      addr.ban_address,
      -- centroids will be merged later
      array_agg(addr.geom) AS geom,
      addr.eligibility_status,

      json_agg(
        DISTINCT jsonb_build_object(
          'id', t.id,
          'name', t.name,
          'created_at', t.created_at,
          'user', jsonb_build_object(
            'id', u.id,
            'role', u.role,
            'gestionnaires', u.gestionnaires,
            'first_name', u.first_name,
            'last_name', u.last_name,
            'structure_name', u.structure_name,
            'structure_type', u.structure_type,
            'phone', u.phone
          )
        )
      ) FILTER (WHERE t.id IS NOT NULL) AS tests

    FROM pro_eligibility_tests_addresses addr
    LEFT JOIN pro_eligibility_tests t ON addr.test_id = t.id
    LEFT JOIN users u ON t.user_id = u.id

    WHERE addr.ban_address IS NOT NULL

    GROUP BY addr.ban_address, addr.eligibility_status
  ) a
) features;
    `.execute(kdb);

    const geojson = result.rows[0].json_build_object;

    await writeFile(filepathToExport, JSON.stringify(geojson));

    return filepathToExport;
  }
}
