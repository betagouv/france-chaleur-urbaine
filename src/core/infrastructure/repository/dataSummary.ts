import db from 'src/db';
import { meaningFullEnergies } from 'src/types/enum/EnergyType';
import { Summary } from 'src/types/Summary';
import { EnergySummary } from 'src/types/Summary/Energy';
import { GasSummary } from 'src/types/Summary/Gas';
import { NetworkSummary } from 'src/types/Summary/Network';

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
): Promise<NetworkSummary[]> =>
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
): Promise<GasSummary[]> =>
  db('conso_gaz_2020_r11_geocoded')
    .select('conso', 'pdl')
    .where(db.raw(getWithinQuery(swLng, swLat, neLng, neLat)));

const getEnergySummary = async (
  swLng: number,
  swLat: number,
  neLng: number,
  neLat: number
): Promise<EnergySummary[]> =>
  db('registre_copro_r11_220125')
    .select('id', 'energie_utilisee')
    .whereIn('energie_utilisee', meaningFullEnergies)
    .andWhere(db.raw(getWithinQuery(swLng, swLat, neLng, neLat)));

const getCloseGasSummary = async (
  swLng: number,
  swLat: number,
  neLng: number,
  neLat: number
): Promise<GasSummary[]> =>
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
): Promise<EnergySummary[]> =>
  db('registre_copro_r11_220125 as energy')
    .select('id', 'energie_utilisee')
    .whereIn('energie_utilisee', meaningFullEnergies)
    .andWhere(db.raw(getWithinQuery(swLng, swLat, neLng, neLat)))
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
): Promise<Summary> => {
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
