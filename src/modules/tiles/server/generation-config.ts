import { defineTilesConfig } from '@/modules/tiles/server/generation';
import { reseauxDeChaleurGeoJSONQuery } from '@/modules/tiles/server/generation-configs/reseaux-de-chaleur';
import { testsAdressesGeoJSONQuery } from '@/modules/tiles/server/generation-configs/tests-adresses';
import {
  downloadGeoJSONFromURL,
  extractGeoJSONFromDatabaseTable,
  extractZippedShapefileToGeoJSON,
  getInputFilePath,
} from '@/modules/tiles/server/generation-strategies';
import { ObjectKeys } from '@/utils/typescript';

export const tilesConfigs = {
  'etudes-en-cours': defineTilesConfig({
    tilesTableName: 'etudes_en_cours_tiles',
    generateGeoJSON: extractGeoJSONFromDatabaseTable('etudes_en_cours'),
  }),
  'perimetres-geothermie-profonde': defineTilesConfig({
    tilesTableName: 'perimetres_geothermie_profonde_tiles',
    zoomMax: 11,
    // Attention, il faut avoir corrigé le format du fichier au préalable
    // sed -i 's/tableauFeature/Feature/g' gelules_geoth.geojson
    generateGeoJSON: getInputFilePath,
  }),
  'tests-adresses': defineTilesConfig({
    tilesTableName: 'tests_adresses_tiles',
    zoomMax: 12,
    tippeCanoeArgs: '--drop-rate=0 --no-tile-size-limit --no-feature-limit',
    generateGeoJSON: testsAdressesGeoJSONQuery,
  }),
  'reseaux-de-chaleur': defineTilesConfig({
    tilesTableName: 'reseaux_de_chaleur_tiles',
    tilesGenerationMethod: 'legacy',
    generateGeoJSON: reseauxDeChaleurGeoJSONQuery,
  }),
  'reseaux-de-froid': defineTilesConfig({
    tilesTableName: 'reseaux_de_froid_tiles',
    tilesGenerationMethod: 'legacy',
    generateGeoJSON: extractGeoJSONFromDatabaseTable('reseaux_de_froid'),
  }),
  'reseaux-en-construction': defineTilesConfig({
    tilesTableName: 'zones_et_reseaux_en_construction_tiles',
    tilesGenerationMethod: 'legacy',
    generateGeoJSON: extractGeoJSONFromDatabaseTable('zones_et_reseaux_en_construction'),
  }),
  'perimetres-de-developpement-prioritaire': defineTilesConfig({
    tilesTableName: 'zone_de_developpement_prioritaire_tiles',
    tilesGenerationMethod: 'legacy',
    generateGeoJSON: extractGeoJSONFromDatabaseTable('zone_de_developpement_prioritaire'),
  }),
  'installations-geothermie-surface-echangeurs-fermes': defineTilesConfig({
    tilesTableName: 'installations_geothermie_surface_echangeurs_fermes_tiles',
    zoomMax: 10,
    tippeCanoeArgs: '-r1.3',
    // Source : https://www.geothermies.fr/outils/guides/services-web-cartographiques-des-installations-de-geothermie-de-surface-ademe-brgm
    generateGeoJSON: downloadGeoJSONFromURL(
      'https://data.geoscience.fr/api/geothermyInstallationClosedLoopWXS?service=wfs&version=2.0.0&request=GetFeature&typenames=vue_gthsurf_diff_install_sonde:vue_gthsurf_diff_install_sonde&outputFormat=application/json&srsName=EPSG:4326'
    ),
  }),
  'installations-geothermie-surface-echangeurs-ouverts': defineTilesConfig({
    tilesTableName: 'installations_geothermie_surface_echangeurs_ouverts_tiles',
    zoomMax: 10,
    tippeCanoeArgs: '-r1.3',
    // Source : https://www.geothermies.fr/outils/guides/services-web-cartographiques-des-installations-de-geothermie-de-surface-ademe-brgm
    generateGeoJSON: downloadGeoJSONFromURL(
      'https://data.geoscience.fr/api/geothermyInstallationOpenLoopWXS?service=wfs&version=2.0.0&request=GetFeature&typenames=installation_geothermie_aquif:vue_gthsurf_diff_install_aquif&outputFormat=application/json&srsName=EPSG:4326'
    ),
  }),
  'ouvrages-geothermie-surface-echangeurs-fermes': defineTilesConfig({
    tilesTableName: 'ouvrages_geothermie_surface_echangeurs_fermes_tiles',
    zoomMax: 10,
    tippeCanoeArgs: '-r1.8',
    // Source : https://www.geothermies.fr/outils/guides/services-web-cartographiques-des-installations-de-geothermie-de-surface-ademe-brgm
    generateGeoJSON: downloadGeoJSONFromURL(
      'https://data.geoscience.fr/api/geothermyInstallationPartClosedLoopWXS?service=wfs&version=2.0.0&request=GetFeature&typenames=ouvrage_geothermie_sonde:vue_gthsurf_diff_ouvrage_sonde&outputFormat=application/json&srsName=EPSG:4326'
    ),
  }),
  'ouvrages-geothermie-surface-echangeurs-ouverts': defineTilesConfig({
    tilesTableName: 'ouvrages_geothermie_surface_echangeurs_ouverts_tiles',
    zoomMax: 10,
    tippeCanoeArgs: '-r1.3',
    // Source : https://www.geothermies.fr/outils/guides/services-web-cartographiques-des-installations-de-geothermie-de-surface-ademe-brgm
    generateGeoJSON: downloadGeoJSONFromURL(
      'https://data.geoscience.fr/api/geothermyInstallationPartOpenLoopWXS?service=wfs&version=2.0.0&request=GetFeature&typenames=ouvrage_geothermie_aquif:vue_gthsurf_diff_ouvrage_aquif&outputFormat=application/json&srsName=EPSG:4326'
    ),
  }),
  'zones-opportunite-froid': defineTilesConfig({
    tilesTableName: 'zone_a_potentiel_froid_tiles',
    zoomMax: 12,
    generateGeoJSON: extractGeoJSONFromDatabaseTable('zone_a_potentiel_froid'),
  }),
  'zones-opportunite-fort-froid': defineTilesConfig({
    tilesTableName: 'zone_a_potentiel_fort_froid_tiles',
    zoomMax: 12,
    generateGeoJSON: extractGeoJSONFromDatabaseTable('zone_a_potentiel_fort_froid'),
  }),
  'zones-a-urbaniser': defineTilesConfig({
    tilesTableName: 'zone_a_urbaniser_tiles',
    zoomMax: 12,
    // Source : https://cerema.app.box.com/s/0jiohobsodkj2lnoplfoziz7hn5wgc0z
    generateGeoJSON: extractZippedShapefileToGeoJSON,
  }),
  'ressources-geothermales-nappes': defineTilesConfig({
    tilesTableName: 'zone_a_urbaniser_tiles',
    zoomMax: 12,
    // Source : https://drive.google.com/file/d/1w4lLWQCW1nMoRuIyZvVO5dMLMELo-YD3/view?usp=drive_link
    generateGeoJSON: extractZippedShapefileToGeoJSON,
  }),
};

export const tilesTypes = ObjectKeys(tilesConfigs);
export type TilesType = (typeof tilesTypes)[number];
