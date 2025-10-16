import { multiLineString } from '@turf/helpers';
import turfLength from '@turf/length';
import type { ExportFormat, LinearHeatDensity } from '@/modules/data/constants';
import type { BdnbBatiments } from '@/server/db/kysely';
import { kdb, sql } from '@/server/db/kysely';
import { getSpreadSheet, zip } from '@/server/services/export';
import { consoColumns, fioulColumns, gasColumns } from '@/server/services/export.config';

const getGeomWithinPolygonQuery = (coordinates: number[][]) =>
  sql.raw<boolean>(`
ST_DWithin(
  geom,
  ST_Transform(
    ST_GeomFromEWKT('SRID=4326;POLYGON((${coordinates.map((coords) => coords.join(' ')).join(',')}))'),
    2154
  ),
  0
)
`);

const getNetworkSummary = async (coordinates: number[][]) =>
  kdb
    .selectFrom('reseaux_de_chaleur')
    .select(
      sql
        .raw<number>(`
        ST_Length(
          ST_Intersection(
            geom,
            ST_Transform(
              ST_GeomFromEWKT('SRID=4326;POLYGON((${coordinates.map((coords) => coords.join(' ')).join(',')}))'),
              2154
            )
          )
        )
      `)
        .as('length')
    )
    .where(
      sql.raw<boolean>(`
        ST_Intersects(
          geom,
            ST_Transform(
              ST_GeomFromEWKT('SRID=4326;POLYGON((${coordinates.map((coords) => coords.join(' ')).join(',')}))'),
              2154
            )
        )
      `)
    )
    .execute();

const exportDonneesDeConsoGaz = async (coordinates: number[][]) =>
  kdb
    .selectFrom('donnees_de_consos')
    .select([
      'adresse',
      'code_grand',
      'conso_nb',
      'pdl_nb',
      sql<boolean>`
        EXISTS (
          SELECT 1
          FROM reseaux_de_chaleur rdc
          WHERE ST_DWithin(
            rdc.geom,
            donnees_de_consos.geom,
            50
          )
          LIMIT 1
        )
      `.as('is_close'),
    ])
    .where(getGeomWithinPolygonQuery(coordinates))
    .execute();

const exportBatimentsCollectifsAvecEnergie = async (
  coordinates: number[][],
  energies: BdnbBatiments['dpe_representatif_logement_type_energie_chauffage'][]
) =>
  kdb
    .selectFrom('bdnb_batiments')
    .select([
      'dpe_representatif_logement_type_energie_chauffage as energie_utilisee',
      'adresse_libelle_adr_principale_ban as addr_label',
      'ffo_bat_nb_log as nb_logements',
      sql<boolean>`
        EXISTS (
          SELECT 1
          FROM reseaux_de_chaleur rdc
          WHERE ST_DWithin(
            rdc.geom,
            bdnb_batiments.geom,
            50
          )
          LIMIT 1
        )
      `.as('is_close'),
    ])
    .where('adresse_libelle_adr_principale_ban', 'is not', null)
    .where('dpe_representatif_logement_type_installation_chauffage', '=', 'collectif')
    .where('dpe_representatif_logement_type_energie_chauffage', 'in', energies)
    .where(getGeomWithinPolygonQuery(coordinates))
    .execute();

/**
 * Utilisé par l'outil d'extraction des données pour obtenir les cumuls de conso et d'énergie
 */
export const getPolygonSummary = async (coordinates: number[][]) => {
  const [gas, energy, network] = await Promise.all([
    exportDonneesDeConsoGaz(coordinates),
    exportBatimentsCollectifsAvecEnergie(coordinates, ['fioul', 'gaz']),
    getNetworkSummary(coordinates),
  ]);

  return {
    energy,
    gas,
    network,
  };
};

/**
 * Utilisé pour l'export zip pour l'extraction des données des bâtiments.
 */
export const exportPolygonSummary = async (coordinates: number[][], exportType: ExportFormat) => {
  const [gas, energyGas, energyFioul] = await Promise.all([
    exportDonneesDeConsoGaz(coordinates),
    exportBatimentsCollectifsAvecEnergie(coordinates, ['gaz']),
    exportBatimentsCollectifsAvecEnergie(coordinates, ['fioul']),
  ]);

  return zip(
    [
      {
        name: `consos_gaz.${exportType}`,
        sheet: getSpreadSheet(consoColumns, gas as any, exportType),
      },
      {
        name: `chauffage_collectif_fioul.${exportType}`,
        sheet: getSpreadSheet(fioulColumns, energyFioul as any, exportType),
      },
      {
        name: `chauffage_collectif_gaz.${exportType}`,
        sheet: getSpreadSheet(gasColumns, energyGas as any, exportType),
      },
    ],
    'export_fcu'
  );
};

/**
 * Utilisé pour l'outil de densité thermique linéaire pour obtenir les consommations de gaz et les besoins en chaleur.
 */
export const getDensiteThermiqueLineaire = async (coordinates: number[][][]): Promise<LinearHeatDensity> => {
  const [consommationGazA10m, consommationGazA50m, besoinsEnChaleurA10m, besoinsEnChaleurA50m] = await Promise.all([
    kdb.selectFrom('donnees_de_consos').select('conso_nb').where(buildNearbyGeometriesFilter(coordinates, 10)).execute(),
    kdb.selectFrom('donnees_de_consos').select('conso_nb').where(buildNearbyGeometriesFilter(coordinates, 50)).execute(),
    kdb
      .selectFrom('besoins_en_chaleur_batiments')
      .select(sql<number>`chauf_mwh::integer`.as('conso_nb'))
      .where(buildNearbyGeometriesFilter(coordinates, 10))
      .execute(),
    kdb
      .selectFrom('besoins_en_chaleur_batiments')
      .select(sql<number>`chauf_mwh::integer`.as('conso_nb'))
      .where(buildNearbyGeometriesFilter(coordinates, 50))
      .execute(),
  ]);

  const longueurTotale = turfLength(multiLineString(coordinates));

  return {
    besoinsEnChaleur: {
      cumul: {
        '10m': getConso(besoinsEnChaleurA10m),
        '50m': getConso(besoinsEnChaleurA50m),
      },
      densitéThermiqueLinéaire: {
        '10m': getDensite(longueurTotale, besoinsEnChaleurA10m),
        '50m': getDensite(longueurTotale, besoinsEnChaleurA50m),
      },
    },
    consommationGaz: {
      cumul: {
        '10m': getConso(consommationGazA10m),
        '50m': getConso(consommationGazA50m),
      },
      densitéThermiqueLinéaire: {
        '10m': getDensite(longueurTotale, consommationGazA10m),
        '50m': getDensite(longueurTotale, consommationGazA50m),
      },
    },
    longueurTotale: Math.round(longueurTotale * 1000),
  };
};

const buildNearbyGeometriesFilter = (linesCoords: number[][][], distance: number) => sql<boolean>`
  ST_DWithin(
    geom,
    ST_Transform(
      ST_GeomFromText(
        'MULTILINESTRING(
            ${sql.raw(linesCoords.map((lineCoords) => `(${lineCoords.map((coords) => `${coords[0]} ${coords[1]}`).join(', ')})`).join(','))}
        )',
        4326
      ),
      2154
    ),
    ${distance}
  )
`;

type PointDeConsommation = {
  conso_nb: number;
};

const getConso = (consos: PointDeConsommation[]) => {
  const sum = consos.reduce((acc, current) => acc + current.conso_nb, 0);
  if (sum > 1000) {
    return `${(sum / 1000).toFixed(2)} GWh`;
  }

  return `${sum.toFixed(2)} MWh`;
};

const getDensite = (size: number, densite: PointDeConsommation[]) => {
  if (densite.length === 0) {
    return '0 MWh/m';
  }
  const value = densite.reduce((acc, value) => acc + value.conso_nb, 0) / (size * 1000);
  if (value > 1000) {
    return `${(value / 1000).toFixed(2)} GWh/m`;
  }

  return `${value.toFixed(2)} MWh/m`;
};
