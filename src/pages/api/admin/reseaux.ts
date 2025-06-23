import { kdb, sql } from '@/server/db/kysely';
import { handleRouteErrors } from '@/server/helpers/server';
import { type BoundingBox } from '@/types/Coords';
import { type FrontendType } from '@/utils/typescript';

const GET = async () => {
  const [reseauxDeChaleur, reseauxEnConstruction] = await Promise.all([
    kdb
      .selectFrom('reseaux_de_chaleur')
      .select([
        'id_fcu',
        'Identifiant reseau',
        'nom_reseau',
        'tags',
        sql<BoundingBox>`st_transform(ST_Envelope(geom), 4326)::box2d`.as('bbox'),
      ])
      .orderBy('id_fcu')
      .execute(),
    kdb
      .selectFrom('zones_et_reseaux_en_construction')
      .select(['id_fcu', 'tags', sql<BoundingBox>`st_transform(ST_Envelope(geom), 4326)::box2d`.as('bbox')])
      .orderBy('id_fcu')
      .execute(),
  ]);

  // transforme les bbox en JS pour être performant
  reseauxDeChaleur.forEach((reseau) => {
    reseau.bbox = parseBbox(reseau.bbox as unknown as string);
  });
  reseauxEnConstruction.forEach((reseau) => {
    reseau.bbox = parseBbox(reseau.bbox as unknown as string);
  });

  return {
    reseauxDeChaleur,
    reseauxEnConstruction,
  };
};
export type AdminReseauxResponse = FrontendType<Awaited<ReturnType<typeof GET>>>;

export default handleRouteErrors(
  { GET },
  {
    requireAuthentication: ['admin'],
  }
);

// Format: "BOX(3.385585947402232 47.35474249860378,3.38691096486787 47.35645923457523)"
const parseBbox = (bbox: string): BoundingBox => {
  const [min, max] = bbox.slice(4, -1).split(',');
  const [minX, minY] = min.split(' ').map(Number);
  const [maxX, maxY] = max.split(' ').map(Number);
  return [minX, minY, maxX, maxY];
};
