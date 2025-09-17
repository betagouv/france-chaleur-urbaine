import { type DB } from '@/server/db/kysely';
import { type Logger } from '@/server/helpers/logger';

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
   * Fonction ayant pour but de générer un fichier GeoJSON et de retourner son chemin, afin qu'il soit importé dans la base de données.
   * @param config
   * @returns path to the generated GeoJSON file
   */
  generateGeoJSON: (config: GenerateGeoJSONConfig) => Promise<string>;
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
    zoomMin: 5,
    zoomMax: 14,
    tippeCanoeArgs: '',
    ...config,
  };
}

export const defineTilesGenerationStrategy = (fn: (config: GenerateGeoJSONConfig) => Promise<string>) => {
  return fn;
};

export type ImportGeoJSONConfig = {
  geojsonFilePath: string;
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
