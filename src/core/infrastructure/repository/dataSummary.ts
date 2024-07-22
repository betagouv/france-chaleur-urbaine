import db from 'src/db';
import { EXPORT_FORMAT } from 'src/types/enum/ExportFormat';
import { Summary } from 'src/types/Summary';
import { EnergySummary } from 'src/types/Summary/Energy';
import { GasSummary } from 'src/types/Summary/Gas';
import { NetworkSummary } from 'src/types/Summary/Network';

import { getSpreadSheet, zip } from './export';
import { consoColumns, fioulColumns, gasColumns } from './export.config';

const getRegions = async (coordinates: number[][]): Promise<string[]> => {
  const results = await db('regions')
    .select('bnb_nom')
    .where(
      db.raw(`
        ST_Intersects(
          ST_Transform(geom, 4326),
          ST_MakePolygon(
            ST_MakeLine(
              Array[${coordinates.map((coords) => `ST_SetSRID(ST_MakePoint(${coords}), 4326)`)}]
            ))
        )
      `)
    );
  return results.map((result) => result.bnb_nom);
};

const getWithinQuery = (coordinates: number[][], geom: string) => `
ST_WITHIN(
  ST_Transform(${geom}, 4326),
  ST_MakePolygon(
    ST_MakeLine(
      Array[${coordinates.map((coords) => `ST_SetSRID(ST_MakePoint(${coords}), 4326)`)}]
    ))
)
`;

const getConsoCloseLineQuery = (coordinates: number[][], distance: number) => `
ST_DWithin(
  geom,
  ST_Transform(
    ST_MakeLine(
      Array[${coordinates.map((coords) => `ST_SetSRID(ST_MakePoint(${coords}), 4326)`)}]
    ),
    2154
  ),
  ${distance}
)
`;

const getNetworkSummary = async (coordinates: number[][]): Promise<NetworkSummary[]> =>
  db('reseaux_de_chaleur')
    .select(
      db.raw(`
        ST_Length(
          ST_Transform(
            ST_Intersection(
              ST_Transform(geom, 4326),
              ST_MakePolygon(
                ST_MakeLine(
                  Array[${coordinates.map((coords) => `ST_SetSRID(ST_MakePoint(${coords}), 4326)`)}]
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
              Array[${coordinates.map((coords) => `ST_SetSRID(ST_MakePoint(${coords}), 4326)`)}]
            ))
    )
      `)
    );

const getGasSummary = async (coordinates: number[][]): Promise<GasSummary[]> =>
  db('donnees_de_consos as gas')
    .select(
      'conso_nb',
      'pdl_nb',
      db.raw(`
      EXISTS (
        SELECT *
        FROM reseaux_de_chaleur rdc
        WHERE ST_DWithin(
          rdc.geom,
          gas.geom,
          50)
        LIMIT 1
      ) as is_close
      `)
    )
    .where(db.raw(getWithinQuery(coordinates, 'geom')));

const getEnergySummary = async (coordinates: number[][], region: string): Promise<EnergySummary[]> =>
  db(`${region} as energy`)
    .select(
      'dpe_mix_arrete_type_energie_chauffage as energie_utilisee',
      db.raw(`
      EXISTS (
        SELECT *
        FROM reseaux_de_chaleur rdc
        WHERE ST_DWithin(
          rdc.geom,
          ST_Transform(energy.geom_adresse, 2154), -- projection 4326
          50)
        LIMIT 1
      ) as is_close
      `)
    )
    .whereNotNull('libelle_adr_principale_ban')
    .whereIn('dpe_mix_arrete_type_energie_chauffage', ['gaz', 'fioul'])
    .andWhere('dpe_mix_arrete_type_installation_chauffage', 'collectif')
    .andWhere(db.raw(getWithinQuery(coordinates, 'geom_adresse')));

const exportGasSummary = async (coordinates: number[][]): Promise<GasSummary[]> =>
  db('donnees_de_consos as gas')
    .select(
      'adresse',
      'nom_commun',
      'code_grand',
      'conso_nb',
      'pdl_nb',
      db.raw(`
        EXISTS (
          SELECT *
          FROM reseaux_de_chaleur rdc
          WHERE ST_DWithin(
            rdc.geom,
            gas.geom,
            50)
          LIMIT 1
        ) as is_close
      `)
    )
    .where(db.raw(getWithinQuery(coordinates, 'geom')));

const exportEnergyGasSummary = async (coordinates: number[][], region: string): Promise<EnergySummary[]> =>
  db(`${region} as energy`)
    .select(
      'libelle_adr_principale_ban as addr_label',
      'ffo_bat_nb_log as nb_logements',
      db.raw(`
        EXISTS (
          SELECT *
          FROM reseaux_de_chaleur rdc
          WHERE ST_DWithin(
            rdc.geom,
            ST_Transform(energy.geom_adresse, 2154),
            50)
          LIMIT 1
        ) as is_close
      `)
    )
    .whereNotNull('libelle_adr_principale_ban')
    .andWhere('dpe_mix_arrete_type_installation_chauffage', 'collectif')
    .andWhere('dpe_mix_arrete_type_energie_chauffage', 'gaz')
    .andWhere(db.raw(getWithinQuery(coordinates, 'geom_adresse')));

const exportEnergyFioulSummary = async (coordinates: number[][], region: string): Promise<EnergySummary[]> =>
  db(`${region} as energy`)
    .select(
      'libelle_adr_principale_ban as addr_label',
      'ffo_bat_nb_log as nb_logements',
      db.raw(`
        EXISTS (
          SELECT *
          FROM reseaux_de_chaleur rdc
          WHERE ST_DWithin(
            rdc.geom,
            ST_Transform(energy.geom_adresse, 2154),
            50)
          LIMIT 1
        ) as is_close
      `)
    )
    .whereNotNull('libelle_adr_principale_ban')
    .andWhere('dpe_mix_arrete_type_installation_chauffage', 'collectif')
    .andWhere('dpe_mix_arrete_type_energie_chauffage', 'fioul')
    .andWhere(db.raw(getWithinQuery(coordinates, 'geom_adresse')));

export const getPolygonSummary = async (coordinates: number[][]): Promise<Summary> => {
  const regions = await getRegions(coordinates);
  const [gas, energy, network] = await Promise.all([
    getGasSummary(coordinates),
    Promise.all(regions.map((region) => getEnergySummary(coordinates, region))).then((results) => results.flatMap((x) => x)),
    getNetworkSummary(coordinates),
  ]);

  return {
    gas,
    energy,
    network,
  };
};

export const exportPolygonSummary = async (coordinates: number[][], exportType: EXPORT_FORMAT): Promise<{ content: any; name: string }> => {
  const regions = await getRegions(coordinates);
  const [gas, energyGas, energyFioul] = await Promise.all([
    exportGasSummary(coordinates),
    Promise.all(regions.map((region) => exportEnergyGasSummary(coordinates, region))).then((results) => results.flatMap((x) => x)),
    Promise.all(regions.map((region) => exportEnergyFioulSummary(coordinates, region))).then((results) => results.flatMap((x) => x)),
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

export const getLineSummary = async (coordinates: number[][]) => {
  const [result10, result50] = await Promise.all([
    db('donnees_de_consos as gas')
      .select('conso_nb', 'pdl_nb', 'rownum')
      .where(db.raw(getConsoCloseLineQuery(coordinates, 10))),
    db('donnees_de_consos as gas')
      .select('conso_nb', 'pdl_nb', 'rownum')
      .where(db.raw(getConsoCloseLineQuery(coordinates, 50))),
  ]);
  return { 10: result10, 50: result50 };
};
