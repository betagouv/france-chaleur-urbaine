import type { DB } from '@/server/db/kysely';
import type { Logger } from '@/server/helpers/logger';

/**
 * Tables tuiles
 */
export type TilesTable = keyof {
  [K in keyof DB as K extends `${string}_tiles` ? K : never]: true;
};

type TilesGenerationConfig = {
  /**
   * Nom de la table dans la base de données où seront importées les tuiles.
   */
  tilesTableName: TilesTable;
  /**
   * 5 par défaut, généralement ne pas changer.
   */
  zoomMin?: number;
  /**
   * 14 par défaut, on peut le changer pour diminuer la quantité de tuiles.
   */
  zoomMax?: number;
  /**
   * Avec legacy, utilise le module node geojsonvt pour générer les tuiles. Avec compressed, utilise tippecanoe.
   */
  tilesGenerationMethod?: 'legacy' | 'compressed';
  /**
   * Arguments supplémentaires pour tippecanoe.
   */
  tippeCanoeArgs?: string;
  /**
   * Fonction ayant pour but de générer un ou plusieurs fichiers GeoJSON et de retourner leur(s) chemin(s), afin qu'ils soient importés dans la base de données.
   * @param config
   * @returns path(s) to the generated GeoJSON file(s)
   */
  generateGeoJSON: (config: GenerateGeoJSONConfig) => Promise<string | ImportLayerConfig[]>;
};
type TilesGenerationConfigWithDefaults = Required<TilesGenerationConfig>;

export type GenerateGeoJSONConfig = {
  inputFilePath?: string;
  logger: Logger;
  tempDirectory: string;
};

/**
 * Define a tiles generation strategy
 * @param config - The configuration for the tiles generation strategy
 * @returns The tiles generation strategy
 */
export function defineTilesConfig(config: TilesGenerationConfig): TilesGenerationConfigWithDefaults {
  return {
    tilesGenerationMethod: 'legacy',
    tippeCanoeArgs: '',
    zoomMax: 14,
    zoomMin: 5,
    ...config,
  };
}

export const defineTilesGenerationStrategy = (fn: (config: GenerateGeoJSONConfig) => Promise<string | ImportLayerConfig[]>) => {
  return fn;
};

export type ImportLayerConfig = {
  layerName: string;
  filePath: string;
};

export type ImportGeoJSONConfig = {
  geojsonConfig: string | ImportLayerConfig[];
  logger: Logger;
  tempDirectory: string;
  tilesTableName: TilesTable;
  zoomMin: number;
  zoomMax: number;
  tippeCanoeArgs?: string;
};

export const defineTilesImportStrategy = (fn: (config: ImportGeoJSONConfig) => Promise<void>) => {
  return fn;
};
