import { db, sql } from '@/server/db/kysely';
import { type BoundingBox } from '@/types/Coords';

type TypeCommune = 'Réseau Existant' | 'Réseau Futur' | 'Fort Potentiel' | 'Potentiel' | 'Sans Potentiel';

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

  const nbReseauxExistantsPromise = db
    .selectFrom('reseaux_de_chaleur')
    .leftJoin('ign_communes', (join) => join.on('ign_communes.insee_com', '=', codeInsee))
    .where(sql<boolean>`ST_Intersects(reseaux_de_chaleur.geom, st_buffer(ign_communes.geom, -150))`)
    .select(db.fn.countAll<number>().as('count'))
    .executeTakeFirstOrThrow();

  const nbReseauxFutursPromise = db
    .selectFrom('zones_et_reseaux_en_construction')
    .leftJoin('ign_communes', (join) => join.on('ign_communes.insee_com', '=', codeInsee))
    .where(sql<boolean>`ST_Intersects(zones_et_reseaux_en_construction.geom, st_buffer(ign_communes.geom, -150))`)
    .select(db.fn.countAll<number>().as('count'))
    .executeTakeFirstOrThrow();

  const [commune, zonesAFortPotentiel, zonesAPotentiel, { count: nbReseauxExistants }, { count: nbReseauxFuturs }] = await Promise.all([
    communePromise,
    zonesAFortPotentielPromise,
    zonesAPotentielPromise,
    nbReseauxExistantsPromise,
    nbReseauxFutursPromise,
  ]);

  if (!commune) {
    return null;
  }

  const result = {
    ...commune,
    zonesAFortPotentiel: {
      nb: zonesAFortPotentiel.length,
      chauffage: zonesAFortPotentiel.reduce((sum, zone) => sum + (zone.chauf_mwh ?? 0), 0),
      ecs: zonesAFortPotentiel.reduce((sum, zone) => sum + (zone.ecs_mwh ?? 0), 0),
    },
    zonesAPotentiel: {
      nb: zonesAPotentiel.length,
      chauffage: zonesAPotentiel.reduce((sum, zone) => sum + (zone.chauf_mwh ?? 0), 0),
      ecs: zonesAPotentiel.reduce((sum, zone) => sum + (zone.ecs_mwh ?? 0), 0),
    },
    nbReseauxExistants: nbReseauxExistants,
    nbReseauxFuturs: nbReseauxFuturs,
    bounds: commune?.bounds,
  };

  const type: TypeCommune =
    result.nbReseauxExistants > 0
      ? 'Réseau Existant'
      : result.nbReseauxFuturs > 0
      ? 'Réseau Futur'
      : result.zonesAFortPotentiel.nb > 0
      ? 'Fort Potentiel'
      : result.zonesAPotentiel.nb > 0
      ? 'Potentiel'
      : 'Sans Potentiel';

  return { ...result, type };
};
