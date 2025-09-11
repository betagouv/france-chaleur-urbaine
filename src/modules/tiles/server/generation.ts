import { type Logger } from '@/server/helpers/logger';

type TilesGenerationConfig = {
  /**
   * Nom de la table dans la base de données où seront importées les tuiles.
   */
  tilesTableName: string;
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
