import { kdb, sql } from '@/server/db/kysely';

export const getBatEnrBatimentDetails = async ({ lat, lon }: { lat: number; lon: number }) => {
  const point = sql`ST_Transform(ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326), 2154)`;
  const batiment = await kdb
    .selectFrom('bdnb_batenr')
    .select([
      'batiment_groupe_id',
      'gmi_nappe_200',
      'pot_nappe',
      'place_nappe',
      'gmi_sonde_200',
      'gis_geo_profonde',
      'ac1',
      'ac2',
      'ac3',
      'ac4',
      'ac4bis',
      'liste_ppa',
      'etat_ppa',
    ])
    .where(sql<boolean>`ST_DWithin(geom, ${point}, 30)`)
    .orderBy(sql`geom <-> ${point}`)
    .limit(1)
    .executeTakeFirst();

  return batiment;
};
