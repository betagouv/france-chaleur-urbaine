import { readFile, rename } from 'node:fs/promises';
import { basename, join } from 'node:path';

import { defineTilesImportStrategy, type TilesTable } from '@/modules/tiles/server/generation';
import { serverConfig } from '@/server/config';
import db from '@/server/db';
import { kdb } from '@/server/db/kysely';
import { logger } from '@/server/helpers/logger';
import { processInParallel } from '@/types/async';
import { type CommandResult, dockerVolumePath, listDirectoryEntries, type RunCommandOptions, runBash, runDocker } from '@/utils/system';

/**
 * Importe un fichier GeoJSON en base avec tippecanoe.
 */
export const importGeoJSONWithTipeeCanoe = defineTilesImportStrategy(
  async ({ tempDirectory, geojsonFilePath, tilesTableName, zoomMin, zoomMax, tippeCanoeArgs }) => {
    const targetTilesDirPath = join(tempDirectory, 'tiles');

    await generateTilesFromGeoJSON({
      geojsonFilePath,
      outputDirectory: targetTilesDirPath,
      tippeCanoeArgs,
      zoomMax,
      zoomMin,
    });
    await importTilesDirectoryToTable(targetTilesDirPath, tilesTableName);
  }
);

type TippecanoeConfig = {
  geojsonFilePath: string;
  outputDirectory: string;
  zoomMin: number;
  zoomMax: number;
  tippeCanoeArgs?: string;
};

export const runTippecanoe = async (command: string, options: RunCommandOptions = {}): Promise<CommandResult> => {
  return serverConfig.USE_DOCKER_GEO_COMMANDS
    ? await runDocker('naxgrp/tippecanoe', `tippecanoe ${command}`, options)
    : await runBash(`tippecanoe ${command}`, options);
};

/**
 * Génère les tuiles sous forme de répertoire à partir d'un fichier GeoJSON.
 * @param config - Configuration des tuiles
 */
export const generateTilesFromGeoJSON = async (config: TippecanoeConfig) => {
  if (serverConfig.USE_DOCKER_GEO_COMMANDS) {
    const inputFileName = basename(config.geojsonFilePath);
    const outputDirectoryName = 'output_tiles';
    await rename(config.geojsonFilePath, join(dockerVolumePath, inputFileName));
    await runDocker(
      'naxgrp/tippecanoe',
      `tippecanoe -e ${outputDirectoryName} --layer=layer --force --generate-ids --minimum-zoom=${config.zoomMin} --maximum-zoom=${config.zoomMax} ${config.tippeCanoeArgs ?? ''} ${basename(inputFileName)}`,
      { captureOutput: true }
    );
    // input
    await rename(join(dockerVolumePath, inputFileName), config.geojsonFilePath);
    // output
    await rename(join(dockerVolumePath, outputDirectoryName), config.outputDirectory);
  } else {
    await runBash(
      `tippecanoe -e ${config.outputDirectory} --layer=layer --force --generate-ids --minimum-zoom=${config.zoomMin} --maximum-zoom=${config.zoomMax} ${config.tippeCanoeArgs ?? ''} ${config.geojsonFilePath}`,
      { captureOutput: true }
    );
  }
};

/**
 * Importe un répertoire de tuiles (généré par tippecanoe) dans une table.
 * @param tilesDirectory - Répertoire des tuiles
 * @param destinationTable - Table de destination
 */
const importTilesDirectoryToTable = async (tilesDirectory: string, destinationTable: TilesTable) => {
  if (await db.schema.hasTable(destinationTable)) {
    logger.info('flushing destination table', {
      table: destinationTable,
    });
    await kdb.deleteFrom(destinationTable).execute();
  } else {
    logger.info('destination table does not exist, creating it', {
      table: destinationTable,
    });
    await kdb.schema
      .createTable(destinationTable)
      .addColumn('x', 'bigint', (col) => col.notNull())
      .addColumn('y', 'bigint', (col) => col.notNull())
      .addColumn('z', 'bigint', (col) => col.notNull())
      .addColumn('tile', 'bytea', (col) => col.notNull())
      .addPrimaryKeyConstraint(`${destinationTable}_pkey`, ['x', 'y', 'z'])
      .execute();
  }

  await importTilesDirectory(tilesDirectory, destinationTable);
};

const QUERY_PARALLELISM = 50; // max queries in //

/**
 * Generate tiles from GeoJSON data and store them in a postgres table
 */
const importTilesDirectory = async (basePath: string, destinationTable: string) => {
  const startTime = Date.now();

  const zoomLevels = await listDirectoryEntries(basePath, 'dir');

  const tiles: { x: number; y: number; z: number; path: string }[] = [];
  await Promise.all(
    zoomLevels.map(async (zoomLevel) => {
      const columns = await listDirectoryEntries(join(basePath, zoomLevel), 'dir');
      await Promise.all(
        columns.map(async (column) => {
          const rows = await listDirectoryEntries(join(basePath, zoomLevel, column), 'file');
          rows.forEach((row) => {
            tiles.push({
              path: join(basePath, zoomLevel, column, row),
              x: Number.parseInt(column, 10),
              y: Number.parseInt(row, 10),
              z: Number.parseInt(zoomLevel, 10),
            });
          });
        })
      );
    })
  );

  logger.info('importing tiles', {
    nbTiles: tiles.length,
  });

  await processInParallel(tiles, QUERY_PARALLELISM, async (tile) => {
    try {
      const tileData = await readFile(tile.path);
      await db(destinationTable)
        .insert({
          tile: tileData,
          x: tile.x,
          y: tile.y,
          z: tile.z,
        })
        .onConflict(['x', 'y', 'z'])
        .merge();
    } catch (err: any) {
      logger.error(`Error inserting tile ${tile.z}/${tile.x}/${tile.y}`, {
        error: err.message,
      });
    }
  });

  logger.info('finished importing tiles', {
    duration: Date.now() - startTime,
  });
};
