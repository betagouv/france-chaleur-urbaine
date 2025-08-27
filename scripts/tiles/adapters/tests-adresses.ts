import { unlink, writeFile } from 'fs/promises';

import { kdb, sql } from '@/server/db/kysely';

import { BaseAdapter } from '../base';

export default class TestsAdressesAdapter extends BaseAdapter {
  public databaseName = 'pro_eligibility_tests_addresses';
  public name = 'tests-adresses';
  public zoomMax: number = 12;
  public tippeCanoeArgs = '--drop-rate=0 --no-tile-size-limit --no-feature-limit';

  async generateGeoJSON(options?: { input?: string; output?: string }) {
    const filepathToExport = options?.output || `/tmp/${this.databaseName}.geojson`;
    await unlink(filepathToExport).catch(() => {});
    const result = await sql<any>`
    SELECT json_build_object(
      'type', 'FeatureCollection',
      'features', json_agg(feature)
    )
    FROM (
      SELECT json_build_object(
        'id', row_number() OVER (),
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
          ) AS tests

        FROM pro_eligibility_tests_addresses addr
        LEFT JOIN pro_eligibility_tests t ON addr.test_id = t.id
        LEFT JOIN users u ON t.user_id = u.id

        WHERE addr.ban_address IS NOT NULL
        AND addr.ban_score > 60

        GROUP BY addr.ban_address, addr.eligibility_status

        UNION ALL

        SELECT
          addr.ban_address,
          -- centroids will be merged later
          array_agg(addr.geom) AS geom,
          addr.eligibility_status,

          json_agg(
            DISTINCT jsonb_build_object(
              'id', t.id,
              'name', t.id,
              'created_at', t.created_at,
              'user', jsonb_build_object(
                'id', COALESCE(u.id::text, t.email),
                'role', u.role,
                'gestionnaires', u.gestionnaires,
                'first_name', COALESCE(u.first_name, t.email),
                'last_name', COALESCE(u.last_name, ''),
                'structure_name', u.structure_name,
                'structure_type', u.structure_type,
                'phone', u.phone
              )
            )
          ) AS tests

        FROM eligibility_demands_addresses addr
        LEFT JOIN eligibility_demands t ON t.eligibility_test_id = addr.test_id
        LEFT JOIN users u ON t.email = u.email

        WHERE addr.ban_address IS NOT NULL
        AND addr.ban_score > 60

        GROUP BY addr.ban_address, addr.eligibility_status
      ) a
    ) features;
        `.execute(kdb);

    const geojson = result.rows[0].json_build_object;
    this.logger.info(`Found ${geojson.features.length} features`);

    geojson.features = geojson.features.map(({ properties, ...feature }: any) => {
      const { tests, ...rest } = properties;

      const interestedUsers = tests.reduce((acc: any, { user, ...test }: any) => {
        acc[user.id] = acc[user.id] || {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          gestionnaires: user.gestionnaires,
          structure_name: user.structure_name,
          structure_type: user.structure_type,
          phone: user.phone,
          tests: [],
        };

        acc[user.id].tests.push(test);
        return acc;
      }, {} as any);

      return {
        ...feature,
        properties: { ...feature.properties, nbUsers: Object.keys(interestedUsers).length, users: Object.values(interestedUsers), ...rest },
      };
    });

    await writeFile(filepathToExport, JSON.stringify(geojson));

    return filepathToExport;
  }
}
