import { createNextApiRateLimiter } from '@/modules/security/server/rate-limit/next-pages';
import { kdb, sql } from '@/server/db/kysely';
import { handleRouteErrors, requireGetMethod, streamJsonArray } from '@/server/helpers/server';

// disable the warning for this route as the result is big > 50MB
export const config = {
  api: {
    responseLimit: false,
  },
};

const rateLimiter = createNextApiRateLimiter({ max: 2, path: '/api/v1/networks', windowMs: 60 * 1000 });

export default handleRouteErrors(async (req, res) => {
  requireGetMethod(req);
  await rateLimiter(req, res);

  await streamJsonArray(
    kdb
      .selectFrom('reseaux_de_chaleur')
      .select([
        'id_fcu',
        'Identifiant reseau',
        'nom_reseau',
        'Gestionnaire',
        'Taux EnR&R',
        'contenu CO2',
        'contenu CO2 ACV',
        sql<GeoJSON.Geometry>`st_asgeojson(st_transform(geom, 4326))::jsonb`.as('geom'),
      ])
      .union(
        kdb
          .selectFrom('reseaux_de_froid')
          .select([
            'id_fcu',
            'Identifiant reseau',
            'nom_reseau',
            'Gestionnaire',
            'Taux EnR&R',
            'contenu CO2',
            'contenu CO2 ACV',
            sql<GeoJSON.Geometry>`st_asgeojson(st_transform(geom, 4326))::jsonb`.as('geom'),
          ])
      )
      .stream(),
    res
  );
});
