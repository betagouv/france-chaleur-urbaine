import { z } from 'zod';

import * as demandsService from '@/modules/demands/server/demands-service';
import type { GenerateGeoJSONConfig, ImportLayerConfig, TilesGenerationConfig, TilesTable } from '@/modules/tiles/server/generation';
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
import { ObjectKeys, type SerializeField } from '@/utils/typescript';

/**
 * Convertit un type de base de données en type de tuile.
 * Les champs non-primitifs (arrays, objects, Json) sont sérialisés en string.
 */
export type AsTile<T> = {
  [K in keyof T]: SerializeField<T[K]>;
};

type DatabaseTileSourceConfig = {
  /** Si false, les tuiles ne sont pas compressées avec gzip (true par défaut) */
  compressedTiles?: boolean;
  /** Anciens identifiants pour la rétrocompatibilité des URLs */
  aliases?: readonly string[];
} & TilesGenerationConfig;

type InMemoryCacheTileSourceConfig = {
  /** Fonction pour construire les features GeoJSON */
  cache: (properties: string[]) => Promise<GeoJSON.Feature<GeoJSON.Point>[]>;
  /** Propriétés à inclure dans les tuiles */
  properties: string[];
};

type TileSourceConfig = DatabaseTileSourceConfig | InMemoryCacheTileSourceConfig;

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
  'ouvert_aux_raccordements',
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

/**
 * Configuration de toutes les sources de données au format tuiles utilisées pour la carte.
 * Contient également la stratégie de génération des tuiles.
 *
 * - Les clés servent d'identifiant pour l'appel API (/api/map/{source-id}/{z}/{x}/{y}) et la CLI (pnpm cli tiles generate <source-id>)
 * - Certaines sources ont des propriétés bien définies utilisées pour les popups de la carte
 * - `aliases` permet de maintenir la rétrocompatibilité avec les anciennes URLs
 *
 * Structure :
 * - Sources avec `tilesTableName` : tuiles pré-générées stockées en base
 * - Sources avec `cache` : tuiles générées dynamiquement en mémoire (1 seule = demands)
 */
export const tileSourcesConfig = {
  'batiments-raccordes-reseaux-chaleur-froid': {
    aliases: ['batimentsRaccordesReseauxChaleurFroid'],
    generateGeoJSON: downloadBatimentsRaccordesReseauxChaleurFroidJSON,
    tilesTableName: 'batiments_raccordes_reseaux_chaleur_froid_tiles',
    tippeCanoeArgs: '-r1.0',
    zoomMax: 13,
    zoomMin: 9,
  },
  'bdnb-batiments': {
    aliases: ['bdnbBatiments'],
    generateGeoJSON: extractNDJSONFromDatabaseTable('bdnb_batiments', {
      fields: bdnbBatimentsFields,
    }),
    tilesTableName: 'bdnb_batiments_tiles',
    tippeCanoeArgs: '--read-parallel --drop-rate=1.3 --drop-densest-as-needed --drop-smallest-as-needed --maximum-tile-bytes=1000000',
    zoomMax: 15,
    zoomMin: 12,
  },
  'besoins-en-chaleur': {
    aliases: ['besoinsEnChaleur'],
    generateGeoJSON: fixmeNotImplemented,
    tilesTableName: 'besoins_en_chaleur_tiles',
  },
  'besoins-en-chaleur-industrie-communes': {
    aliases: ['besoinsEnChaleurIndustrieCommunes'],
    generateGeoJSON: fixmeNotImplemented,
    tilesTableName: 'besoins_en_chaleur_industrie_communes_tiles',
  },
  'communes-fort-potentiel-pour-creation-reseaux-chaleur': {
    aliases: ['communesFortPotentielPourCreationReseauxChaleur'],
    generateGeoJSON: fixmeNotImplemented,
    tilesTableName: 'communes_fort_potentiel_pour_creation_reseaux_chaleur_tiles',
  },
  'consommations-gaz': {
    aliases: ['consommationsGaz'],
    generateGeoJSON: extractGeoJSONFromDatabaseTable('donnees_de_consos'),
    tilesTableName: 'donnees_de_consos_tiles',
    tippeCanoeArgs: '-r1.0',
    zoomMin: 12,
  },
  demands: {
    cache: demandsService.buildFeatures,
    properties: ['Mode de chauffage', 'Adresse', 'Type de chauffage', 'Structure'],
  },
  'enrr-mobilisables': {
    aliases: ['enrrMobilisables'],
    compressedTiles: false,
    generateGeoJSON: fixmeNotImplemented,
    tilesTableName: 'enrr_mobilisables_tiles',
  },
  'enrr-mobilisables-friches': {
    aliases: ['enrrMobilisables-friches'],
    compressedTiles: false,
    generateGeoJSON: fixmeNotImplemented,
    tilesTableName: 'enrr_mobilisables_friches_tiles',
  },
  'enrr-mobilisables-parkings': {
    aliases: ['enrrMobilisables-parkings'],
    compressedTiles: false,
    generateGeoJSON: fixmeNotImplemented,
    tilesTableName: 'enrr_mobilisables_parkings_tiles',
  },
  'enrr-mobilisables-thalassothermie': {
    aliases: ['enrrMobilisables-thalassothermie'],
    generateGeoJSON: fixmeNotImplemented,
    tilesTableName: 'enrr_mobilisables_thalassothermie_tiles',
  },
  'enrr-mobilisables-zones-geothermie-profonde': {
    aliases: ['enrrMobilisables-zonesGeothermieProfonde'],
    generateGeoJSON: fixmeNotImplemented,
    tilesTableName: 'enrr_mobilisables_zones_geothermie_profonde_tiles',
  },
  'etudes-en-cours': {
    aliases: ['etudesEnCours'],
    generateGeoJSON: extractGeoJSONFromDatabaseTable('etudes_en_cours'),
    tilesTableName: 'etudes_en_cours_tiles',
  },
  'installations-geothermie-profonde': {
    aliases: ['installationsGeothermieProfonde'],
    generateGeoJSON: fixmeNotImplemented,
    tilesTableName: 'installations_geothermie_profonde_tiles',
  },
  'installations-geothermie-surface-echangeurs-fermes': {
    aliases: ['installationsGeothermieSurfaceEchangeursFermes'],
    // Source : https://www.geothermies.fr/outils/guides/services-web-cartographiques-des-installations-de-geothermie-de-surface-ademe-brgm
    generateGeoJSON: downloadGeoJSONFromURL(
      'https://data.geoscience.fr/api/geothermyInstallationClosedLoopWXS?service=wfs&version=2.0.0&request=GetFeature&typenames=vue_gthsurf_diff_install_sonde:vue_gthsurf_diff_install_sonde&outputFormat=application/json&srsName=EPSG:4326'
    ),
    tilesTableName: 'installations_geothermie_surface_echangeurs_fermes_tiles',
    tippeCanoeArgs: '-r1.3',
    zoomMax: 10,
  },
  'installations-geothermie-surface-echangeurs-ouverts': {
    aliases: ['installationsGeothermieSurfaceEchangeursOuverts'],
    // Source : https://www.geothermies.fr/outils/guides/services-web-cartographiques-des-installations-de-geothermie-de-surface-ademe-brgm
    generateGeoJSON: downloadGeoJSONFromURL(
      'https://data.geoscience.fr/api/geothermyInstallationOpenLoopWXS?service=wfs&version=2.0.0&request=GetFeature&typenames=installation_geothermie_aquif:vue_gthsurf_diff_install_aquif&outputFormat=application/json&srsName=EPSG:4326'
    ),
    tilesTableName: 'installations_geothermie_surface_echangeurs_ouverts_tiles',
    tippeCanoeArgs: '-r1.3',
    zoomMax: 10,
  },
  'ouvrages-geothermie-surface-echangeurs-fermes': {
    aliases: ['ouvragesGeothermieSurfaceEchangeursFermes'],
    // Source : https://www.geothermies.fr/outils/guides/services-web-cartographiques-des-installations-de-geothermie-de-surface-ademe-brgm
    generateGeoJSON: downloadGeoJSONFromURL(
      'https://data.geoscience.fr/api/geothermyInstallationPartClosedLoopWXS?service=wfs&version=2.0.0&request=GetFeature&typenames=ouvrage_geothermie_sonde:vue_gthsurf_diff_ouvrage_sonde&outputFormat=application/json&srsName=EPSG:4326'
    ),
    tilesTableName: 'ouvrages_geothermie_surface_echangeurs_fermes_tiles',
    tippeCanoeArgs: '-r1.8',
    zoomMax: 10,
  },
  'ouvrages-geothermie-surface-echangeurs-ouverts': {
    aliases: ['ouvragesGeothermieSurfaceEchangeursOuverts'],
    // Source : https://www.geothermies.fr/outils/guides/services-web-cartographiques-des-installations-de-geothermie-de-surface-ademe-brgm
    generateGeoJSON: downloadGeoJSONFromURL(
      'https://data.geoscience.fr/api/geothermyInstallationPartOpenLoopWXS?service=wfs&version=2.0.0&request=GetFeature&typenames=ouvrage_geothermie_aquif:vue_gthsurf_diff_ouvrage_aquif&outputFormat=application/json&srsName=EPSG:4326'
    ),
    tilesTableName: 'ouvrages_geothermie_surface_echangeurs_ouverts_tiles',
    tippeCanoeArgs: '-r1.3',
    zoomMax: 10,
  },
  'perimetres-de-developpement-prioritaire': {
    aliases: ['perimetresDeDeveloppementPrioritaire'],
    generateGeoJSON: extractNDJSONFromDatabaseTable('zone_de_developpement_prioritaire', {
      fields: perimetresDeDeveloppementPrioritaireFields,
      idField: 'id_fcu',
    }),
    tilesTableName: 'zone_de_developpement_prioritaire_tiles',
    tippeCanoeArgs: '-r1',
  },
  'perimetres-geothermie-profonde': {
    aliases: ['perimetresGeothermieProfonde'],
    // Attention, il faut avoir corrigé le format du fichier au préalable
    // sed -i 's/tableauFeature/Feature/g' gelules_geoth.geojson
    generateGeoJSON: getInputFilePath,
    tilesTableName: 'perimetres_geothermie_profonde_tiles',
    zoomMax: 11,
  },
  'quartiers-prioritaires-politique-ville-2015-anru': {
    aliases: ['quartiersPrioritairesPolitiqueVille2015anru'],
    generateGeoJSON: fixmeNotImplemented,
    tilesTableName: 'quartiers_prioritaires_politique_ville_2015_anru_tiles',
  },
  'quartiers-prioritaires-politique-ville-2024': {
    aliases: ['quartiersPrioritairesPolitiqueVille2024'],
    generateGeoJSON: fixmeNotImplemented,
    tilesTableName: 'quartiers_prioritaires_politique_ville_2024_tiles',
  },
  'reseaux-de-chaleur': {
    aliases: ['reseauxDeChaleur'],
    generateGeoJSON: reseauxDeChaleurGeoJSONQuery,
    tilesTableName: 'reseaux_de_chaleur_tiles',
    tippeCanoeArgs: '-r1',
  },
  'reseaux-de-froid': {
    aliases: ['reseauxDeFroid'],
    generateGeoJSON: extractNDJSONFromDatabaseTable('reseaux_de_froid', {
      fields: reseauxDeFroidFields,
      idField: 'id_fcu',
    }),
    tilesTableName: 'reseaux_de_froid_tiles',
    tippeCanoeArgs: '-r1',
  },
  'reseaux-en-construction': {
    aliases: ['reseauxEnConstruction'],
    generateGeoJSON: extractNDJSONFromDatabaseTable('zones_et_reseaux_en_construction', {
      fields: reseauxEnConstructionFields,
      idField: 'id_fcu',
    }),
    tilesTableName: 'zones_et_reseaux_en_construction_tiles',
    tippeCanoeArgs: '-r1',
  },
  'ressources-geothermales-nappes': {
    aliases: ['ressourcesGeothermalesNappes'],
    // Source : https://drive.google.com/file/d/1w4lLWQCW1nMoRuIyZvVO5dMLMELo-YD3/view?usp=drive_link
    generateGeoJSON: extractZippedShapefileToGeoJSON,
    tilesTableName: 'ressources_geothermales_nappes_tiles',
    zoomMax: 12,
  },
  'tests-adresses': {
    aliases: ['testsAdresses'],
    generateGeoJSON: testsAdressesGeoJSONQuery,
    tilesTableName: 'pro_eligibility_tests_addresses_tiles',
    tippeCanoeArgs: '--drop-rate=0 --no-tile-size-limit --no-feature-limit',
    zoomMax: 12,
  },
  'zones-a-urbaniser': {
    aliases: ['zonesAUrbaniser'],
    // Source : https://cerema.app.box.com/s/0jiohobsodkj2lnoplfoziz7hn5wgc0z
    generateGeoJSON: extractZippedShapefileToGeoJSON,
    tilesTableName: 'zone_a_urbaniser_tiles',
    zoomMax: 12,
  },
  'zones-opportunite-fort-froid': {
    aliases: ['zonesPotentielFortFroid'],
    generateGeoJSON: extractGeoJSONFromDatabaseTable('zone_a_potentiel_fort_froid'),
    tilesTableName: 'zone_a_potentiel_fort_froid_tiles',
    zoomMax: 12,
  },
  'zones-opportunite-froid': {
    aliases: ['zonesPotentielFroid'],
    generateGeoJSON: extractGeoJSONFromDatabaseTable('zone_a_potentiel_froid'),
    tilesTableName: 'zone_a_potentiel_froid_tiles',
    zoomMax: 12,
  },
  'zones-potentiel-chaud': {
    aliases: ['zonesPotentielChaud'],
    generateGeoJSON: fixmeNotImplemented,
    tilesTableName: 'zone_a_potentiel_chaud_tiles',
  },
  'zones-potentiel-fort-chaud': {
    aliases: ['zonesPotentielFortChaud'],
    generateGeoJSON: fixmeNotImplemented,
    tilesTableName: 'zone_a_potentiel_fort_chaud_tiles',
  },
} as const satisfies Record<string, TileSourceConfig>;

export type TileSourceId = keyof typeof tileSourcesConfig;

export type DatabaseTileSourceId = {
  [K in TileSourceId]: (typeof tileSourcesConfig)[K] extends { tilesTableName: TilesTable } ? K : never;
}[TileSourceId];

export type CacheTileSourceId = {
  [K in TileSourceId]: (typeof tileSourcesConfig)[K] extends { cache: unknown } ? K : never;
}[TileSourceId];

export const zTileSourceId = z.enum(ObjectKeys(tileSourcesConfig));

/**
 * Type union de tous les identifiants de sources générables.
 * Exclut les sources cache (demands) qui n'ont pas de tilesTableName.
 */
export type TilesType = Exclude<TileSourceId, CacheTileSourceId>;

export const tilesTypes = ObjectKeys(tileSourcesConfig).filter((key): key is TilesType => 'tilesTableName' in tileSourcesConfig[key]);

export function getGenerationConfig(sourceId: TilesType) {
  const sourceConfig = tileSourcesConfig[sourceId] as DatabaseTileSourceConfig;
  return {
    generateGeoJSON: sourceConfig.generateGeoJSON,
    tilesTableName: sourceConfig.tilesTableName,
    tippeCanoeArgs: sourceConfig.tippeCanoeArgs ?? '',
    zoomMax: sourceConfig.zoomMax ?? 14,
    zoomMin: sourceConfig.zoomMin ?? 5,
  };
}

/**
 * Utilisé comme marqueur pour les sources dont la génération n'est pas encore implémentée.
 */
function fixmeNotImplemented(_config: GenerateGeoJSONConfig): Promise<string | ImportLayerConfig[]> {
  throw new Error('Not implemented');
}
