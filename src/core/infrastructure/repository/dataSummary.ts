import db from 'src/db';

const getWithinQuery = (
  swLng: number,
  swLat: number,
  neLng: number,
  neLat: number
) => `
ST_WITHIN(
  ST_Transform(geom, 4326),
  ST_MakeEnvelope(
    ${swLng}, 
    ${swLat}, 
    ${neLng}, 
    ${neLat}, 
    4326)
) is true
`;

const getNetworkSummary = async (
  swLng: number,
  swLat: number,
  neLng: number,
  neLat: number
) =>
  db('reseaux_de_chaleur_new')
    .select(
      db.raw(`
        ST_Length(
          ST_Transform(
            ST_Intersection(
              ST_Transform(geom, 4326),
              ST_MakeEnvelope(
                ${swLng}, 
                ${swLat}, 
                ${neLng}, 
                ${neLat}, 
                4326)
            ),
            2154
          )
        ) as length
      `)
    )
    .where(
      db.raw(`
        ST_Intersects(
          ST_Transform(geom, 4326),
          ST_MakeEnvelope(
            ${swLng}, 
            ${swLat}, 
            ${neLng}, 
            ${neLat}, 
            4326)
        ) is true
      `)
    );

const getGasSummary = async (
  swLng: number,
  swLat: number,
  neLng: number,
  neLat: number
) =>
  db('conso_gaz_2020_r11_geocoded')
    .select('conso', 'pdl')
    .where(db.raw(getWithinQuery(swLng, swLat, neLng, neLat)));

const getEnergySummary = async (
  swLng: number,
  swLat: number,
  neLng: number,
  neLat: number
) =>
  db('registre_copro_r11_220125')
    .select('id')
    .where(db.raw(getWithinQuery(swLng, swLat, neLng, neLat)));

const getCloseGasSummary = async (
  swLng: number,
  swLat: number,
  neLng: number,
  neLat: number
) =>
  db('conso_gaz_2020_r11_geocoded as gas')
    .select('conso', 'pdl')
    .where(db.raw(getWithinQuery(swLng, swLat, neLng, neLat)))
    .andWhere(
      db.raw(`
        EXISTS (
          SELECT *
          FROM reseaux_de_chaleur_new rdc
          WHERE ST_Distance(
            ST_Transform(rdc.geom, 2154),
            ST_Transform(gas.geom, 2154)
            ) < 50
          LIMIT 1
        )
      `)
    );

const getCloseEnergySummary = async (
  swLng: number,
  swLat: number,
  neLng: number,
  neLat: number
) =>
  db('registre_copro_r11_220125 as energy')
    .select('id')
    .where(db.raw(getWithinQuery(swLng, swLat, neLng, neLat)))
    .andWhere(
      db.raw(`
        EXISTS (
          SELECT *
          FROM reseaux_de_chaleur_new rdc
          WHERE ST_Distance(
            ST_Transform(rdc.geom, 2154),
            ST_Transform(energy.geom, 2154)
            ) < 50
          LIMIT 1
        )
      `)
    );

const getDataSummary = async (
  swLng: number,
  swLat: number,
  neLng: number,
  neLat: number
): Promise<any> => {
  const [gas, energy, network, closeGas, closeEnergy] = await Promise.all([
    getGasSummary(swLng, swLat, neLng, neLat),
    getEnergySummary(swLng, swLat, neLng, neLat),
    getNetworkSummary(swLng, swLat, neLng, neLat),
    getCloseGasSummary(swLng, swLat, neLng, neLat),
    getCloseEnergySummary(swLng, swLat, neLng, neLat),
  ]);

  return {
    gas,
    energy,
    network,
    closeGas,
    closeEnergy,
  };
};

export default getDataSummary;
