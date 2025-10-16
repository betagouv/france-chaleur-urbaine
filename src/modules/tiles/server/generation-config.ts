import { defineTilesConfig } from '@/modules/tiles/server/generation';
import { reseauxDeChaleurGeoJSONQuery } from '@/modules/tiles/server/generation-configs/reseaux-de-chaleur';
import { testsAdressesGeoJSONQuery } from '@/modules/tiles/server/generation-configs/tests-adresses';
import {
  downloadGeoJSONFromURL,
  downloadJSONAndTransformToGeoJSON,
  extractGeoJSONFromDatabaseTable,
  extractNDJSONFromDatabaseTable,
  extractZippedShapefileToGeoJSON,
  getInputFilePath,
} from '@/modules/tiles/server/generation-strategies';
import type { BdnbBatiments } from '@/server/db/kysely/database';
import { ObjectKeys } from '@/utils/typescript';

const bdnbBatimentsFields = [
  'batiment_groupe_id',
  'geom',

  'ffo_bat_annee_construction',
  'ffo_bat_nb_log',
  'synthese_propriete_usage',

  'dpe_representatif_logement_classe_bilan_dpe',
  'dpe_representatif_logement_classe_emission_ges',
  'dpe_representatif_logement_surface_habitable_immeuble',
  'dpe_representatif_logement_type_energie_chauffage',
  'dpe_representatif_logement_type_installation_chauffage',
] as const satisfies (keyof BdnbBatiments)[];

type DonneesBrutes = {
  ID: string;
  OPERATEUR: string;
  IRIS: string;
  IRIS_LIBELLE: string;
  FILIERE: 'C' | 'F' | 'NA';
  LAMBERT_93_X: number | 'secret' | 'nd';
  LAMBERT_93_Y: number | 'secret' | 'nd';
  ADRESSE: string;
  NOM_COMMUNE: string;
  CODE_GRAND_SECTEUR: 'A' | 'I' | 'R' | 'T' | 'X';
  CONSO: number | 'secret' | 'nd';
  PDL: number | 'secret' | 'nd';
  ANNEE: string;
};

export const tilesConfigs = {
  'batiments-raccordes-reseaux-chaleur-froid': defineTilesConfig({
    generateGeoJSON: downloadJSONAndTransformToGeoJSON<DonneesBrutes>({
      mapFilterFeature: (item, { convertLambert93ToWGS84 }) => {
        // Skip items with invalid coordinates
        if ([item.LAMBERT_93_X, item.LAMBERT_93_Y].some((coord) => ['secret', 'nd'].some((v) => v === coord))) {
          return null;
        }

        return {
          geometry: {
            coordinates: convertLambert93ToWGS84([item.LAMBERT_93_X as number, item.LAMBERT_93_Y as number]),
            type: 'Point',
          },
          properties: {
            adresse: item.ADRESSE,
            code_grand_secteur: item.CODE_GRAND_SECTEUR,
            conso: typeof item.CONSO === 'number' ? item.CONSO : null,
            filiere: item.FILIERE,
            id_reseau: item.ID !== 'NA' ? item.ID : null,
          },
          type: 'Feature',
        };
      },
      url: 'https://data.statistiques.developpement-durable.gouv.fr/dido/api/v1/datafiles/49ec6b39-cf3b-4280-b25e-2a19f5dc0cfa/json?millesime=2024-09',
    }),
    tilesTableName: 'batiments_raccordes_reseaux_chaleur_froid_tiles',
    tippeCanoeArgs:
      // 2 layers
      '-L batiments_raccordes_reseaux_chaleur:temp_batiments_raccordes_reseaux_chaleur.geojson -L batiments_raccordes_reseaux_froid:temp_batiments_raccordes_reseaux_froid.geojson -r1.0',
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
    generateGeoJSON: extractGeoJSONFromDatabaseTable('zone_de_developpement_prioritaire'),
    tilesTableName: 'zone_de_developpement_prioritaire_tiles',
    tippeCanoeArgs: '--no-tile-compression --layer=zoneDP', // legacy
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
    tippeCanoeArgs: '--no-tile-compression', // legacy
  }),
  'reseaux-de-froid': defineTilesConfig({
    generateGeoJSON: extractGeoJSONFromDatabaseTable('reseaux_de_froid'),
    tilesTableName: 'reseaux_de_froid_tiles',
    tippeCanoeArgs: '--no-tile-compression --layer=coldOutline', // legacy
  }),
  'reseaux-en-construction': defineTilesConfig({
    generateGeoJSON: extractGeoJSONFromDatabaseTable('zones_et_reseaux_en_construction'),
    tilesTableName: 'zones_et_reseaux_en_construction_tiles',
    tippeCanoeArgs: '--no-tile-compression --layer=futurOutline', // legacy
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

export type BdnbBatimentTile = Required<Pick<BdnbBatiments, (typeof bdnbBatimentsFields)[number]>>;
