import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { tilesConfigs, type TilesType } from '@/modules/tiles/server/generation-config';
import { importGeoJSONWithTipeeCanoe } from '@/modules/tiles/server/generation-import';
import { parentLogger } from '@/server/helpers/logger';

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
  await importGeoJSONWithTipeeCanoe({
    geojsonFilePath: geojsonPath,
    logger,
    tempDirectory,
    tilesTableName: config.tilesTableName,
    zoomMin: config.zoomMin,
    zoomMax: config.zoomMax,
    tippeCanoeArgs: config.tippeCanoeArgs,
  });
  logger.info(`GeoJSON importée dans la table ${config.tilesTableName}`);
  await rm(tempDirectory, { recursive: true });
  return config;
}
