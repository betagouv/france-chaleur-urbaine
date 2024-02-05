import { handleRouteErrors, requireGetMethod } from '@helpers/server';
import { Network } from 'src/types/Summary/Network';
import db from 'src/db';

// disable the warning for this route as the result is big > 50MB
export const config = {
  api: {
    responseLimit: false,
  },
};

export default handleRouteErrors(async (req) => {
  requireGetMethod(req);

  const reseaux = await db<Network>('reseaux_de_chaleur').select([
    '*',
    db.raw('st_asgeojson(st_transform(geom, 4326))::jsonb as geom'),
  ]);
  return reseaux;
});
