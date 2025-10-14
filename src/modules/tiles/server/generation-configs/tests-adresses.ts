import { generateGeoJSONFromSQLQuery } from '@/modules/tiles/server/generation-strategies';

export const testsAdressesGeoJSONQuery = generateGeoJSONFromSQLQuery(
  `
SELECT json_build_object(
  'type', 'FeatureCollection',
  'features', json_agg(feature)
) as geojson
FROM (
  SELECT json_build_object(
    'id', row_number() OVER (),
    'type', 'Feature',
    'geometry', ST_AsGeoJSON(ST_ForcePolygonCCW(ST_Transform(ST_Centroid(ST_Collect(a.geom)), 4326)))::json,
    'properties', jsonb_build_object(
      'ban_address', a.ban_address,
      'tests', a.tests,
      'eligibility', a.eligibility,
      'isEligible', (a.eligibility->>'isEligible')::boolean
    )
  ) AS feature
  FROM (
    SELECT
      addr.ban_address,
      -- centroids will be merged later
      array_agg(addr.geom) AS geom,
      -- Get the eligibility from the last item in eligibility_history
      (addr.eligibility_history->-1->'eligibility') AS eligibility,

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
    AND jsonb_array_length(addr.eligibility_history) > 0

    GROUP BY addr.ban_address, addr.eligibility_history
  ) a
) features;
  `,
  ({ properties, ...feature }) => {
    const { tests, ...rest } = properties as any;

    const interestedUsers = tests.reduce((acc: any, { user, ...test }: any) => {
      acc[user.id] = acc[user.id] || {
        first_name: user.first_name,
        gestionnaires: user.gestionnaires,
        id: user.id,
        last_name: user.last_name,
        phone: user.phone,
        role: user.role,
        structure_name: user.structure_name,
        structure_type: user.structure_type,
        tests: [],
      };

      acc[user.id].tests.push(test);
      return acc;
    }, {} as any);

    return {
      ...feature,
      // TODO vérifier, car auparavant ...features.properties (vide)
      properties: { ...properties, nbUsers: Object.keys(interestedUsers).length, users: Object.values(interestedUsers), ...rest },
    };
  }
);
