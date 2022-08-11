import db from 'src/db';
import { ENERGY_USED, meaningFullEnergies } from 'src/types/enum/EnergyType';
import { EXPORT_FORMAT } from 'src/types/enum/ExportFormat';
import { Summary } from 'src/types/Summary';
import { EnergySummary } from 'src/types/Summary/Energy';
import { GasSummary } from 'src/types/Summary/Gas';
import { NetworkSummary } from 'src/types/Summary/Network';
import { getSpreadSheet, zip } from './export';
import { consoColumns, fioulColumns, gasColumns } from './export.config';

const getWithinQuery = (coordinates: number[][]) => `
ST_WITHIN(
  ST_Transform(geom, 4326),
  ST_MakePolygon(
    ST_MakeLine(
      Array[${coordinates.map(
        (coords) => `ST_SetSRID(ST_MakePoint(${coords}), 4326)`
      )}]
    ))
) is true
`;

const getNetworkSummary = async (
  coordinates: number[][]
): Promise<NetworkSummary[]> =>
  db('reseaux_de_chaleur_new')
    .select(
      db.raw(`
        ST_Length(
          ST_Transform(
            ST_Intersection(
              ST_Transform(geom, 4326),
              ST_MakePolygon(
                ST_MakeLine(
                  Array[${coordinates.map(
                    (coords) => `ST_SetSRID(ST_MakePoint(${coords}), 4326)`
                  )}]
                ))
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
          ST_MakePolygon(
            ST_MakeLine(
              Array[${coordinates.map(
                (coords) => `ST_SetSRID(ST_MakePoint(${coords}), 4326)`
              )}]
            ))
    ) is true
      `)
    );

const exportGasSummary = async (
  coordinates: number[][]
): Promise<GasSummary[]> =>
  db('conso_gaz_2020_r11_geocoded')
    .select('result_label', 'code_grand_secteur', 'conso', 'pdl')
    .where(db.raw(getWithinQuery(coordinates)));

const getGasSummary = async (coordinates: number[][]): Promise<GasSummary[]> =>
  db('conso_gaz_2020_r11_geocoded')
    .select('conso', 'pdl')
    .where(db.raw(getWithinQuery(coordinates)));

const exportEnergyGasSummary = async (
  coordinates: number[][]
): Promise<EnergySummary[]> =>
  db('registre_copro_r11_220125')
    .select('adresse_reference')
    .whereIn('energie_utilisee', [
      ENERGY_USED.Gaz,
      ENERGY_USED.GazNaturel,
      ENERGY_USED.GazCollectif,
      ENERGY_USED.GazPropaneButane,
    ])
    .where(db.raw(getWithinQuery(coordinates)));

const exportEnergyFioulSummary = async (
  coordinates: number[][]
): Promise<EnergySummary[]> =>
  db('registre_copro_r11_220125')
    .select('adresse_reference')
    .whereIn('energie_utilisee', [
      ENERGY_USED.Fioul,
      ENERGY_USED.FioulDomestique,
    ])
    .where(db.raw(getWithinQuery(coordinates)));

const getEnergySummary = async (
  coordinates: number[][]
): Promise<EnergySummary[]> =>
  db('registre_copro_r11_220125')
    .select('id', 'energie_utilisee')
    .whereIn('energie_utilisee', meaningFullEnergies)
    .andWhere(db.raw(getWithinQuery(coordinates)));

const getCloseGasSummary = async (
  coordinates: number[][]
): Promise<GasSummary[]> =>
  db('conso_gaz_2020_r11_geocoded as gas')
    .select('conso', 'pdl')
    .where(db.raw(getWithinQuery(coordinates)))
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
  coordinates: number[][]
): Promise<EnergySummary[]> =>
  db('registre_copro_r11_220125 as energy')
    .select('id', 'energie_utilisee')
    .whereIn('energie_utilisee', meaningFullEnergies)
    .andWhere(db.raw(getWithinQuery(coordinates)))
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

export const getDataSummary = async (
  coordinates: number[][]
): Promise<Summary> => {
  const [gas, energy, network, closeGas, closeEnergy] = await Promise.all([
    getGasSummary(coordinates),
    getEnergySummary(coordinates),
    getNetworkSummary(coordinates),
    getCloseGasSummary(coordinates),
    getCloseEnergySummary(coordinates),
  ]);

  return {
    gas,
    energy,
    network,
    closeGas,
    closeEnergy,
  };
};

export const exportDataSummary = async (
  coordinates: number[][],
  exportType: EXPORT_FORMAT
): Promise<{ content: any; name: string }> => {
  const [gas, energyGas, energyFioul] = await Promise.all([
    exportGasSummary(coordinates),
    exportEnergyGasSummary(coordinates),
    exportEnergyFioulSummary(coordinates),
  ]);

  return zip(
    [
      {
        sheet: getSpreadSheet(consoColumns, gas, exportType),
        name: `consos_gaz.${exportType}`,
      },
      {
        sheet: getSpreadSheet(fioulColumns, energyFioul, exportType),
        name: `chauffage_collectif_fioul.${exportType}`,
      },
      {
        sheet: getSpreadSheet(gasColumns, energyGas, exportType),
        name: `chauffage_collectif_gaz.${exportType}`,
      },
    ],
    'export'
  );
};
