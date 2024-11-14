import { db, sql } from 'src/db/kysely';
import { BoundingBox } from 'src/types/Coords';

export const getCommunePotentiel = async (codeInsee: string) => {
  const communePromise = db
    .selectFrom('ign_communes')
    .where('insee_com', '=', codeInsee)
    .select([
      'insee_com',
      'insee_dep',
      'nom',
      sql`
      ARRAY[
        ST_XMin(ST_Transform(geom, 4326)), -- Min Longitude (Bottom-Left)
        ST_YMin(ST_Transform(geom, 4326)), -- Min Latitude (Bottom-Left)
        ST_XMax(ST_Transform(geom, 4326)), -- Max Longitude (Top-Right)
        ST_YMax(ST_Transform(geom, 4326))  -- Max Latitude (Top-Right)
      ]::numeric[]
    `
        .$castTo<BoundingBox>()
        .as('bounds'),
    ])
    .executeTakeFirst();

  const zonesAFortPotentielPromise = db
    .selectFrom('zone_a_potentiel_fort_chaud')
    .where('code_com_i', '=', codeInsee)
    .select(['chauf_mwh', 'ecs_mwh'])
    .execute();

  const zonesAPotentielPromise = db
    .selectFrom('zone_a_potentiel_chaud')
    .where('code_com_i', '=', codeInsee)
    .select(['chauf_mwh', 'ecs_mwh'])
    .execute();

  const [commune, zonesAFortPotentiel, zonesAPotentiel] = await Promise.all([
    communePromise,
    zonesAFortPotentielPromise,
    zonesAPotentielPromise,
  ]);

  if (!commune) {
    return null;
  }

  const reseauxExistants = await db
    .selectFrom('reseaux_de_chaleur')
    .leftJoin('ign_communes', 'ign_communes.insee_com', sql`${codeInsee}` as any)
    .where(sql`ST_Intersects(reseaux_de_chaleur.geom, ign_communes.geom)` as any)
    .selectAll()
    .execute();

  return {
    ...commune,
    zonesAFortPotentiel: {
      nb: zonesAFortPotentiel.length,
      chauffage: zonesAFortPotentiel.reduce((sum, zone) => sum + +(zone.chauf_mwh || 0), 0),
      ecs: zonesAFortPotentiel.reduce((sum, zone) => sum + +(zone.ecs_mwh || 0), 0),
    },
    zonesAPotentiel: {
      nb: zonesAPotentiel.length,
      chauffage: zonesAPotentiel.reduce((sum, zone) => sum + +(zone.chauf_mwh || 0), 0),
      ecs: zonesAPotentiel.reduce((sum, zone) => sum + +(zone.ecs_mwh || 0), 0),
    },
    nbReseauxExistants: reseauxExistants.length,
    bounds: commune?.bounds,
  };
};
