import { db, sql } from 'src/db/kysely';

export const getCommunePotentiel = async (codeInsee: string) => {
  const commune = await db
    .selectFrom('ign_communes')
    .where('insee_com', '=', codeInsee)
    .select([
      'insee_com',
      'insee_dep',
      'nom',
      sql`ST_X(ST_Centroid(geom))::numeric`.as('longitude'), // Longitude of the centroid as numeric
      sql`ST_Y(ST_Centroid(geom))::numeric`.as('latitude'), // Latitude of the centroid as numeric
      sql`ST_AsGeoJSON(geom)::json`.as('geom'), // Geometry as JSON object
    ])
    .executeTakeFirst();

  const zonesAFortPotentiel = await db.selectFrom('zone_a_potentiel_fort_chaud').where('code_com_i', '=', codeInsee).selectAll().execute();

  const zonesAPotentiel = await db.selectFrom('zone_a_potentiel_chaud').where('code_com_i', '=', codeInsee).selectAll().execute();

  const sumChaufMwh = zonesAFortPotentiel.reduce((sum, zone) => sum + +(zone.chauf_mwh || 0), 0);
  const sumECSMwh = zonesAFortPotentiel.reduce((sum, zone) => sum + +(zone.ecs_mwh || 0), 0);

  return {
    ...commune,
    nbZonesAFortPotentiel: zonesAFortPotentiel.length,
    nbZonesAPotentiel: zonesAPotentiel.length,
    besoinsChauffage: sumChaufMwh,
    besoinsECS: sumECSMwh,
  };
};
