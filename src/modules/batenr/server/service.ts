import { kdb, sql } from '@/server/db/kysely';

export const getBatEnrBatimentDetails = async ({ lat, lon }: { lat: number; lon: number }) => {
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
    .where(
      sql.raw<boolean>(`
      ST_DWithin(
        geom,
        ST_Transform('SRID=4326;POINT(${lon} ${lat})'::geometry, 2154),
        3.5
      )
    `)
    )
    .executeTakeFirstOrThrow();

  return batiment;
};
