import { db, sql } from 'src/db/kysely';

type Bounds = [number, number, number, number];

export const getCommunePotentiel = async (codeInsee: string) => {
  const communePromise = db
    .selectFrom('ign_communes')
    .where('insee_com', '=', codeInsee)
    .select([
      'insee_com',
      'insee_dep',
      'nom',
      sql`ST_AsGeoJSON(ST_Transform(geom, 4326))::json`.as('geom'), // Geometry transformed to WGS84 as JSON object
      sql`
      ARRAY[
        ST_XMin(ST_Transform(ST_Envelope(geom), 4326)), -- Min Longitude (Bottom-Left)
        ST_YMin(ST_Transform(ST_Envelope(geom), 4326)), -- Min Latitude (Bottom-Left)
        ST_XMax(ST_Transform(ST_Envelope(geom), 4326)), -- Max Longitude (Top-Right)
        ST_YMax(ST_Transform(ST_Envelope(geom), 4326))  -- Max Latitude (Top-Right)
      ]::numeric[]
    `
        .$castTo<Bounds>()
        .as('bounds'),
    ])
    .executeTakeFirst();

  const zonesAFortPotentielPromise = db.selectFrom('zone_a_potentiel_fort_chaud').where('code_com_i', '=', codeInsee).selectAll().execute();

  const zonesAPotentielPromise = db.selectFrom('zone_a_potentiel_chaud').where('code_com_i', '=', codeInsee).selectAll().execute();

  const [commune, zonesAFortPotentiel, zonesAPotentiel] = await Promise.all([
    communePromise,
    zonesAFortPotentielPromise,
    zonesAPotentielPromise,
  ]);

  if (!commune) {
    return null;
  }

  const sumChaufMwh = zonesAFortPotentiel.reduce((sum, zone) => sum + +(zone.chauf_mwh || 0), 0);
  const sumECSMwh = zonesAFortPotentiel.reduce((sum, zone) => sum + +(zone.ecs_mwh || 0), 0);

  const reseauxExistants = await db
    .selectFrom('reseaux_de_chaleur')
    .leftJoin('ign_communes', 'ign_communes.insee_com', sql`${codeInsee}` as any)
    .where(sql`ST_Intersects(reseaux_de_chaleur.geom, ign_communes.geom)` as any)
    .selectAll()
    .execute();

  return {
    ...commune,
    nbZonesAFortPotentiel: zonesAFortPotentiel.length,
    nbZonesAPotentiel: zonesAPotentiel.length,
    nbReseauxExistants: reseauxExistants.length,
    besoinsChauffage: sumChaufMwh,
    besoinsECS: sumECSMwh,
    bounds: commune?.bounds,
  };
};