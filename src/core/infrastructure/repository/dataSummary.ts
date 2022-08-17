import db from 'src/db';
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
  db('reseaux_de_chaleur')
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
  db('Donnees_de_conso_et_pdl_gaz_nat_2020')
    .select('adresse', 'code_grand', 'conso_nb', 'pdl_nb')
    .where(db.raw(getWithinQuery(coordinates)));

const getGasSummary = async (coordinates: number[][]): Promise<GasSummary[]> =>
  db('Donnees_de_conso_et_pdl_gaz_nat_2020')
    .select('conso_nb', 'pdl_nb')
    .where(db.raw(getWithinQuery(coordinates)));

const exportEnergyGasSummary = async (
  coordinates: number[][]
): Promise<EnergySummary[]> =>
  db('bnb_idf - batiment_adresse')
    .select('etaban202111_label as addr_label')
    .whereNot('bnb_adr_fiabilite_niv_1', 'problème de géocodage')
    .andWhere('adedpe202006_logtype_ch_type_inst', 'collectif')
    .andWhere('adedpe202006_logtype_ch_type_ener_corr', 'gaz')
    .andWhere(db.raw(getWithinQuery(coordinates)));

const exportEnergyFioulSummary = async (
  coordinates: number[][]
): Promise<EnergySummary[]> =>
  db('bnb_idf - batiment_adresse')
    .select('etaban202111_label as addr_label')
    .whereNot('bnb_adr_fiabilite_niv_1', 'problème de géocodage')
    .andWhere('adedpe202006_logtype_ch_type_inst', 'collectif')
    .andWhere('adedpe202006_logtype_ch_type_ener_corr', 'fioul')
    .andWhere(db.raw(getWithinQuery(coordinates)));

const getEnergySummary = async (
  coordinates: number[][]
): Promise<EnergySummary[]> =>
  db('bnb_idf - batiment_adresse')
    .select('adedpe202006_logtype_ch_type_ener_corr as energie_utilisee')
    .whereIn('adedpe202006_logtype_ch_type_ener_corr', ['gaz', 'fioul'])
    .andWhereNot('bnb_adr_fiabilite_niv_1', 'problème de géocodage')
    .andWhere('adedpe202006_logtype_ch_type_inst', 'collectif')
    .andWhere(db.raw(getWithinQuery(coordinates)));

const getCloseGasSummary = async (
  coordinates: number[][]
): Promise<GasSummary[]> =>
  db('Donnees_de_conso_et_pdl_gaz_nat_2020 as gas')
    .select('conso_nb', 'pdl_nb')
    .where(db.raw(getWithinQuery(coordinates)))
    .andWhere(
      db.raw(`
        EXISTS (
          SELECT *
          FROM reseaux_de_chaleur rdc
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
  db('bnb_idf - batiment_adresse as energy')
    .select('adedpe202006_logtype_ch_type_ener_corr as energie_utilisee')
    .whereIn('adedpe202006_logtype_ch_type_ener_corr', ['gaz', 'fioul'])
    .andWhereNot('bnb_adr_fiabilite_niv_1', 'problème de géocodage')
    .andWhere('adedpe202006_logtype_ch_type_inst', 'collectif')
    .andWhere(db.raw(getWithinQuery(coordinates)))
    .andWhere(
      db.raw(`
        EXISTS (
          SELECT *
          FROM reseaux_de_chaleur rdc
          WHERE ST_Distance(
            ST_Transform(rdc.geom, 2154),
            ST_Transform(energy.geom_adresse, 2154)
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
    'export_fcu'
  );
};
