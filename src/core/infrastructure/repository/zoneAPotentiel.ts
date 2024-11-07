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
      sql`ST_X(ST_Transform(ST_Centroid(geom), 4326))::numeric`.$castTo<number>().as('longitude'), // Longitude transformed to WGS84
      sql`ST_Y(ST_Transform(ST_Centroid(geom), 4326))::numeric`.$castTo<number>().as('latitude'), // Latitude transformed to WGS84
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

  const sumChaufMwh = zonesAFortPotentiel.reduce((sum, zone) => sum + +(zone.chauf_mwh || 0), 0);
  const sumECSMwh = zonesAFortPotentiel.reduce((sum, zone) => sum + +(zone.ecs_mwh || 0), 0);

  // Adjusting bounds for better map display
  const adjustedBounds: Bounds = commune?.bounds
    ? [
        commune?.bounds[0] - 0.01, // Min Longitude (Bottom-Left) with a bit of padding
        commune?.bounds[1] - 0.01, // Min Latitude (Bottom-Left) with a bit of padding
        commune?.bounds[2] + 0.01, // Max Longitude (Top-Right) with a bit of padding
        commune?.bounds[3] + 0.01, // Max Latitude (Top-Right) with a bit of padding
      ]
    : [0, 0, 0, 0];

  return {
    ...commune,
    longitude: commune?.longitude,
    latitude: commune?.latitude,
    nbZonesAFortPotentiel: zonesAFortPotentiel.length,
    nbZonesAPotentiel: zonesAPotentiel.length,
    besoinsChauffage: sumChaufMwh,
    besoinsECS: sumECSMwh,
    bounds: adjustedBounds, // Adjusted bounds for better map display
  };
};
