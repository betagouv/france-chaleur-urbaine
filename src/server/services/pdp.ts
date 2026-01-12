import { kdb, sql } from '@/server/db/kysely';

const isInPDP = async (lat: number, lon: number): Promise<boolean> => {
  const pdp = await kdb
    .selectFrom('zone_de_developpement_prioritaire')
    .select('id_fcu')
    .where(
      sql.raw<boolean>(`
        ST_WITHIN(
          ST_Transform('SRID=4326;POINT(${lon} ${lat})'::geometry, 2154),
          geom
        )
      `)
    )
    .executeTakeFirst();

  return pdp !== undefined;
};

export default isInPDP;
