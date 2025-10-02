import { createNextApiRateLimiter } from '@/modules/security/server/rate-limit/next-pages';
import db from '@/server/db';
import { handleRouteErrors, requireGetMethod } from '@/server/helpers/server';
import { type Network } from '@/types/Summary/Network';

// disable the warning for this route as the result is big > 50MB
export const config = {
  api: {
    responseLimit: false,
  },
};

const rateLimiter = createNextApiRateLimiter({ path: '/api/v1/networks' });

export default handleRouteErrors(async (req, res) => {
  requireGetMethod(req);
  await rateLimiter(req, res);

  const reseaux = await Promise.all([
    db<Network>('reseaux_de_chaleur').select([
      'id_fcu',
      'Identifiant reseau',
      'nom_reseau',
      'Gestionnaire',
      'Taux EnR&R',
      'contenu CO2',
      'contenu CO2 ACV',
      db.raw('st_asgeojson(st_transform(geom, 4326))::jsonb as geom'),
    ]),
    db<Network>('reseaux_de_froid').select([
      'id_fcu',
      'Identifiant reseau',
      'nom_reseau',
      'Gestionnaire',
      'Taux EnR&R',
      'contenu CO2',
      'contenu CO2 ACV',
      db.raw('st_asgeojson(st_transform(geom, 4326))::jsonb as geom'),
    ]),
  ]);
  return reseaux.flat();
});
