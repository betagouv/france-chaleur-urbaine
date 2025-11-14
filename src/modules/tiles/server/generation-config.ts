import { defineTilesConfig } from '@/modules/tiles/server/generation';
import { downloadBatimentsRaccordesReseauxChaleurFroidJSON } from '@/modules/tiles/server/generation-configs/batiments-raccordes-reseaux-chaleur-froid';
import { reseauxDeChaleurGeoJSONQuery } from '@/modules/tiles/server/generation-configs/reseaux-de-chaleur';
import { testsAdressesGeoJSONQuery } from '@/modules/tiles/server/generation-configs/tests-adresses';
import {
  downloadGeoJSONFromURL,
  extractGeoJSONFromDatabaseTable,
  extractNDJSONFromDatabaseTable,
  extractZippedShapefileToGeoJSON,
  getInputFilePath,
} from '@/modules/tiles/server/generation-strategies';
import type {
  BdnbBatiments,
  ReseauxDeFroid,
  ZoneDeDeveloppementPrioritaire,
  ZonesEtReseauxEnConstruction,
} from '@/server/db/kysely/database';
import type { SerializeField } from '@/utils/typescript';
import { ObjectKeys } from '@/utils/typescript';

const bdnbBatimentsFields = [
  'batiment_groupe_id',
  'geom',

  'ffo_bat_nb_log',

  'dpe_representatif_logement_classe_bilan_dpe',
  'dpe_representatif_logement_type_energie_chauffage',
  'dpe_representatif_logement_type_installation_chauffage',
] as const satisfies (keyof BdnbBatiments)[];
export type BdnbBatimentTile = AsTile<Required<Pick<BdnbBatiments, (typeof bdnbBatimentsFields)[number]>>>;

const reseauxDeFroidFields = [
  'id_fcu',
  'geom',

  'Taux EnR&R',
  'Gestionnaire',
  'Identifiant reseau',
  'reseaux classes',
  'contenu CO2 ACV',
  'nom_reseau',
  'livraisons_totale_MWh',
  'nb_pdl',
  'has_trace',
] as const satisfies (keyof ReseauxDeFroid)[];
export type ReseauxDeFroidTile = AsTile<Required<Pick<ReseauxDeFroid, (typeof reseauxDeFroidFields)[number]>>>;

const reseauxEnConstructionFields = [
  'id_fcu',
  'geom',

  'nom_reseau',
  'mise_en_service',
  'gestionnaire',
  'is_zone',
  'tags',
] as const satisfies (keyof ZonesEtReseauxEnConstruction)[];
export type ReseauxEnConstructionTile = AsTile<Required<Pick<ZonesEtReseauxEnConstruction, (typeof reseauxEnConstructionFields)[number]>>>;

const perimetresDeDeveloppementPrioritaireFields = [
  'id_fcu',
  'geom',

  'Identifiant reseau',
] as const satisfies (keyof ZoneDeDeveloppementPrioritaire)[];
export type PerimetreDeveloppementPrioritaireTile = AsTile<
  Required<Pick<ZoneDeDeveloppementPrioritaire, (typeof perimetresDeDeveloppementPrioritaireFields)[number]>>
>;

export const tilesConfigs = {
  'batiments-raccordes-reseaux-chaleur-froid': defineTilesConfig({
    generateGeoJSON: downloadBatimentsRaccordesReseauxChaleurFroidJSON,
    tilesTableName: 'batiments_raccordes_reseaux_chaleur_froid_tiles',
    tippeCanoeArgs: '-r1.0',
    zoomMax: 13,
    zoomMin: 9,
  }),

  'bdnb-batiments': defineTilesConfig({
    generateGeoJSON: extractNDJSONFromDatabaseTable('bdnb_batiments', {
      fields: bdnbBatimentsFields,
    }),
    tilesTableName: 'bdnb_batiments_tiles',
    tippeCanoeArgs: '--read-parallel --drop-rate=1.3 --drop-densest-as-needed --drop-smallest-as-needed --maximum-tile-bytes=1000000',
    zoomMax: 15, // pour avoir des bons contours, mais le fond de carte ne semble pas précis pour les batiments
    zoomMin: 12,
  }),
  'consommations-gaz': defineTilesConfig({
    generateGeoJSON: extractGeoJSONFromDatabaseTable('donnees_de_consos'),
    tilesTableName: 'donnees_de_consos_tiles',
    tippeCanoeArgs: '-r1.0', // Do not automatically drop a fraction of points at low zoom levels
    zoomMin: 12,
  }),
  'etudes-en-cours': defineTilesConfig({
    generateGeoJSON: extractGeoJSONFromDatabaseTable('etudes_en_cours'),
    tilesTableName: 'etudes_en_cours_tiles',
  }),
  'installations-geothermie-surface-echangeurs-fermes': defineTilesConfig({
    // Source : https://www.geothermies.fr/outils/guides/services-web-cartographiques-des-installations-de-geothermie-de-surface-ademe-brgm
    generateGeoJSON: downloadGeoJSONFromURL(
      'https://data.geoscience.fr/api/geothermyInstallationClosedLoopWXS?service=wfs&version=2.0.0&request=GetFeature&typenames=vue_gthsurf_diff_install_sonde:vue_gthsurf_diff_install_sonde&outputFormat=application/json&srsName=EPSG:4326'
    ),
    tilesTableName: 'installations_geothermie_surface_echangeurs_fermes_tiles',
    tippeCanoeArgs: '-r1.3',
    zoomMax: 10,
  }),
  'installations-geothermie-surface-echangeurs-ouverts': defineTilesConfig({
    // Source : https://www.geothermies.fr/outils/guides/services-web-cartographiques-des-installations-de-geothermie-de-surface-ademe-brgm
    generateGeoJSON: downloadGeoJSONFromURL(
      'https://data.geoscience.fr/api/geothermyInstallationOpenLoopWXS?service=wfs&version=2.0.0&request=GetFeature&typenames=installation_geothermie_aquif:vue_gthsurf_diff_install_aquif&outputFormat=application/json&srsName=EPSG:4326'
    ),
    tilesTableName: 'installations_geothermie_surface_echangeurs_ouverts_tiles',
    tippeCanoeArgs: '-r1.3',
    zoomMax: 10,
  }),
  'ouvrages-geothermie-surface-echangeurs-fermes': defineTilesConfig({
    // Source : https://www.geothermies.fr/outils/guides/services-web-cartographiques-des-installations-de-geothermie-de-surface-ademe-brgm
    generateGeoJSON: downloadGeoJSONFromURL(
      'https://data.geoscience.fr/api/geothermyInstallationPartClosedLoopWXS?service=wfs&version=2.0.0&request=GetFeature&typenames=ouvrage_geothermie_sonde:vue_gthsurf_diff_ouvrage_sonde&outputFormat=application/json&srsName=EPSG:4326'
    ),
    tilesTableName: 'ouvrages_geothermie_surface_echangeurs_fermes_tiles',
    tippeCanoeArgs: '-r1.8',
    zoomMax: 10,
  }),
  'ouvrages-geothermie-surface-echangeurs-ouverts': defineTilesConfig({
    // Source : https://www.geothermies.fr/outils/guides/services-web-cartographiques-des-installations-de-geothermie-de-surface-ademe-brgm
    generateGeoJSON: downloadGeoJSONFromURL(
      'https://data.geoscience.fr/api/geothermyInstallationPartOpenLoopWXS?service=wfs&version=2.0.0&request=GetFeature&typenames=ouvrage_geothermie_aquif:vue_gthsurf_diff_ouvrage_aquif&outputFormat=application/json&srsName=EPSG:4326'
    ),
    tilesTableName: 'ouvrages_geothermie_surface_echangeurs_ouverts_tiles',
    tippeCanoeArgs: '-r1.3',
    zoomMax: 10,
  }),
  'perimetres-de-developpement-prioritaire': defineTilesConfig({
    generateGeoJSON: extractNDJSONFromDatabaseTable('zone_de_developpement_prioritaire', {
      fields: perimetresDeDeveloppementPrioritaireFields,
      idField: 'id_fcu',
    }),
    tilesTableName: 'zone_de_developpement_prioritaire_tiles',
    tippeCanoeArgs: '-r1',
  }),
  'perimetres-geothermie-profonde': defineTilesConfig({
    // Attention, il faut avoir corrigé le format du fichier au préalable
    // sed -i 's/tableauFeature/Feature/g' gelules_geoth.geojson
    generateGeoJSON: getInputFilePath,
    tilesTableName: 'perimetres_geothermie_profonde_tiles',
    zoomMax: 11,
  }),
  'reseaux-de-chaleur': defineTilesConfig({
    generateGeoJSON: reseauxDeChaleurGeoJSONQuery,
    tilesTableName: 'reseaux_de_chaleur_tiles',
    tippeCanoeArgs: '-r1',
  }),
  'reseaux-de-froid': defineTilesConfig({
    generateGeoJSON: extractNDJSONFromDatabaseTable('reseaux_de_froid', {
      fields: reseauxDeFroidFields,
      idField: 'id_fcu',
    }),
    tilesTableName: 'reseaux_de_froid_tiles',
    tippeCanoeArgs: '-r1',
  }),
  'reseaux-en-construction': defineTilesConfig({
    generateGeoJSON: extractNDJSONFromDatabaseTable('zones_et_reseaux_en_construction', {
      fields: reseauxEnConstructionFields,
      idField: 'id_fcu',
    }),
    tilesTableName: 'zones_et_reseaux_en_construction_tiles',
    tippeCanoeArgs: '-r1',
  }),
  'ressources-geothermales-nappes': defineTilesConfig({
    // Source : https://drive.google.com/file/d/1w4lLWQCW1nMoRuIyZvVO5dMLMELo-YD3/view?usp=drive_link
    generateGeoJSON: extractZippedShapefileToGeoJSON,
    tilesTableName: 'zone_a_urbaniser_tiles',
    zoomMax: 12,
  }),
  'tests-adresses': defineTilesConfig({
    generateGeoJSON: testsAdressesGeoJSONQuery,
    tilesTableName: 'pro_eligibility_tests_addresses_tiles',
    tippeCanoeArgs: '--drop-rate=0 --no-tile-size-limit --no-feature-limit',
    zoomMax: 12,
  }),
  'zones-a-urbaniser': defineTilesConfig({
    // Source : https://cerema.app.box.com/s/0jiohobsodkj2lnoplfoziz7hn5wgc0z
    generateGeoJSON: extractZippedShapefileToGeoJSON,
    tilesTableName: 'zone_a_urbaniser_tiles',
    zoomMax: 12,
  }),
  'zones-opportunite-fort-froid': defineTilesConfig({
    generateGeoJSON: extractGeoJSONFromDatabaseTable('zone_a_potentiel_fort_froid'),
    tilesTableName: 'zone_a_potentiel_fort_froid_tiles',
    zoomMax: 12,
  }),
  'zones-opportunite-froid': defineTilesConfig({
    generateGeoJSON: extractGeoJSONFromDatabaseTable('zone_a_potentiel_froid'),
    tilesTableName: 'zone_a_potentiel_froid_tiles',
    zoomMax: 12,
  }),
};

export const tilesTypes = ObjectKeys(tilesConfigs);
export type TilesType = (typeof tilesTypes)[number];

/**
 * Converts a database type to a Tile type by serializing all non-primitive fields (arrays, objects, Json) to string.
 * Keeps primitive types (string, number, boolean, null, undefined) as-is.
 */
type AsTile<T> = {
  [K in keyof T]: SerializeField<T[K]>;
};
