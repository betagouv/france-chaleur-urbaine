import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { tilesConfigs, type TilesType } from '@/modules/tiles/server/generation-config';
import { parentLogger } from '@/server/helpers/logger';
import { importGeoJSONToTable, importGeoJSONWithTipeeCanoe } from '@cli/tiles/utils';

export async function runTilesGeneration(name: TilesType, inputFilePath?: string) {
  const config = tilesConfigs[name];
  if (!config) {
    throw new Error(`Config for ${name} not found`);
  }
  const logger = parentLogger.child({ name });
  const tempDirectory = await mkdtemp(join(tmpdir(), 'fcu-tiles-'));
  const jobConfig = {
    logger,
    tempDirectory,
  };
  logger.info(`Génération des tuiles`);
  const geojsonPath = await config.generateGeoJSON({ ...jobConfig, inputFilePath });

  logger.info(`Importation du GeoJSON dans la table ${config.tilesTableName}`);
  // TODO refactor pour utiliser le logger
  if (config.tilesGenerationMethod === 'legacy') {
    await importGeoJSONToTable(geojsonPath, config.tilesTableName, config.zoomMin, config.zoomMax);
  } else {
    await importGeoJSONWithTipeeCanoe(geojsonPath, config.tilesTableName, config.zoomMin, config.zoomMax, config.tippeCanoeArgs);
  }
  logger.info(`GeoJSON importée dans la table ${config.tilesTableName}`);
  await rm(tempDirectory, { recursive: true });
  return config;
}
