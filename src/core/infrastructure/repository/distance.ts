import db from 'src/db';

const DEBUG = !!(process.env.API_DEBUG_MODE || null);

const computeDistance = async (lat: number, lon: number): Promise<number> => {
  const { distance } = await db('reseaux_de_chaleur')
    .select(
      db.raw(`ST_Distance(
    ST_Transform('SRID=4326;POINT(${lon} ${lat})'::geometry, 2154),
    ST_Transform(geom, 2154)
  ) as distance`)
    )
    .orderBy('distance')
    .first();

  DEBUG && console.info(`Minimum distance is ${distance} meters.`);
  return distance;
};

export default computeDistance;
