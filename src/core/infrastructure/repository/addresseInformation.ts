import db from 'src/db';

const DEBUG = !!(process.env.API_DEBUG_MODE || null);

export const closestNetwork = async (
  lat: number,
  lon: number
): Promise<{
  distance: number;
  date?: Date;
}> => {
  const network = await db('reseaux_de_chaleur')
    .select(
      db.raw(
        `ST_Distance(
    ST_Transform('SRID=4326;POINT(${lon} ${lat})'::geometry, 2154),
    ST_Transform(geom, 2154)
  ) as distance, date`
      )
    )
    .orderBy('distance')
    .first();

  DEBUG && console.info(`Minimum distance is ${network.distance} meters.`);
  return network;
};

export const getConso = async (
  lat: number,
  lon: number
): Promise<{ conso_nb: number; rownum: string } | null> => {
  const result = await db('Donnees_de_conso_et_pdl_gaz_nat_2020')
    .select('rownum', 'conso_nb')
    .where(
      db.raw(`
        ST_INTERSECTS(
          ST_Transform('SRID=4326;POINT(${lon} ${lat})'::geometry, 2154),
          ST_BUFFER(ST_Transform(geom, 2154), 0.1)
        )
      `)
    )
    .first();
  return result;
};

export const getConsoById = async (
  id: string
): Promise<{ conso_nb: number; rownum: string } | null> => {
  const result = await db('Donnees_de_conso_et_pdl_gaz_nat_2020')
    .select('rownum', 'conso_nb')
    .where('rownum', id)
    .first();
  return result;
};

export const getNbLogement = async (
  lat: number,
  lon: number
): Promise<{ nb_logements: number; fid: string } | null> => {
  const region = await db('regions')
    .select('bnb_nom')
    .where(
      db.raw(`
      ST_Intersects(
        ST_Transform(geom, 2154),
        ST_Transform('SRID=4326;POINT(${lon} ${lat})'::geometry, 2154)
        )
    `)
    )
    .first();
  const result = await db(region.bnb_nom)
    .select(
      'fid',
      db.raw(`
        CASE
          WHEN cerffo2020_nb_log ISNULL 
            THEN anarnc202012_nb_log
          WHEN cerffo2020_nb_log < 1 
            THEN anarnc202012_nb_log
          ELSE cerffo2020_nb_log
        END as nb_logements
      `)
    )
    .where(
      db.raw(`
        ST_INTERSECTS(
          ST_Transform('SRID=4326;POINT(${lon} ${lat})'::geometry, 2154),
          ST_BUFFER(ST_Transform(geom_adresse, 2154), 0.1)
        )
      `)
    )
    .first();
  return result;
};

export const getNbLogementById = async (
  id: string,
  lat: number,
  lon: number
): Promise<{ nb_logements: number; fid: string } | null> => {
  const region = await db('regions')
    .select('bnb_nom')
    .where(
      db.raw(`
      ST_Intersects(
        ST_Transform(geom, 2154),
        ST_Transform('SRID=4326;POINT(${lon} ${lat})'::geometry, 2154)
        )
    `)
    )
    .first();

  const result = await db(region.bnb_nom)
    .select(
      'fid',
      db.raw(`
        CASE
          WHEN cerffo2020_nb_log ISNULL 
            THEN anarnc202012_nb_log
          WHEN cerffo2020_nb_log < 1 
            THEN anarnc202012_nb_log
          ELSE cerffo2020_nb_log
        END as nb_logements
      `)
    )
    .where('fid', id)
    .first();
  return result;
};
