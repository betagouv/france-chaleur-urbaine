import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { importGeoJSONWithTipeeCanoe } from '@/modules/tiles/server/generation-import';
import { getGenerationConfig, type TilesType } from '@/modules/tiles/server/tiles.config';
import { parentLogger } from '@/server/helpers/logger';

/**
 * Log memory usage at a specific stage
 */
function logMemory(logger: any, stage: string) {
  const mem = process.memoryUsage();
  logger.info(`Memory usage - ${stage}`, {
    external: `${Math.round(mem.external / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(mem.heapTotal / 1024 / 1024)}MB`,
    heapUsed: `${Math.round(mem.heapUsed / 1024 / 1024)}MB`,
    rss: `${Math.round(mem.rss / 1024 / 1024)}MB`,
  });
}

export async function runTilesGeneration(name: TilesType, inputFilePath?: string) {
  const config = getGenerationConfig(name);
  const logger = parentLogger.child({ name });

  logMemory(logger, 'start');

  const tempDirectory = await mkdtemp(join(tmpdir(), 'fcu-tiles-'));
  const jobConfig = {
    logger,
    tempDirectory,
  };
  logger.info(`Génération des tuiles`, { config });

  const geojsonResult = await config.generateGeoJSON({ ...jobConfig, inputFilePath });
  logMemory(logger, 'after GeoJSON generation');

  logger.info(`Importation du GeoJSON dans la table ${config.tilesTableName}`);
  await importGeoJSONWithTipeeCanoe({
    geojsonConfig: geojsonResult,
    logger,
    tempDirectory,
    tilesTableName: config.tilesTableName,
    tippeCanoeArgs: config.tippeCanoeArgs,
    zoomMax: config.zoomMax,
    zoomMin: config.zoomMin,
  });
  logMemory(logger, 'after tippecanoe import');

  logger.info(`GeoJSON importée dans la table ${config.tilesTableName}`);
  await rm(tempDirectory, { recursive: true });
  logMemory(logger, 'after cleanup');

  return config;
}
