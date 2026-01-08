import { readFile, rename } from 'node:fs/promises';
import { basename, join } from 'node:path';

import { defineTilesImportStrategy, type TilesTable } from '@/modules/tiles/server/generation';
import { serverConfig } from '@/server/config';
import { kdb, sql } from '@/server/db/kysely';
import { logger } from '@/server/helpers/logger';
import { processInParallel } from '@/utils/async';
import { type CommandResult, dockerVolumePath, listDirectoryEntries, type RunCommandOptions, runBash, runDocker } from '@/utils/system';

/**
 * Importe un fichier GeoJSON en base avec tippecanoe.
 */
export const importGeoJSONWithTipeeCanoe = defineTilesImportStrategy(
  async ({ tempDirectory, geojsonConfig, tilesTableName, zoomMin, zoomMax, tippeCanoeArgs }) => {
    const targetTilesDirPath = join(tempDirectory, 'tiles');

    await generateTilesFromGeoJSON({
      geojsonConfig,
      outputDirectory: targetTilesDirPath,
      tippeCanoeArgs,
      zoomMax,
      zoomMin,
    });
    await importTilesDirectoryToTable(targetTilesDirPath, tilesTableName);
  }
);

type TippecanoeLayer = {
  layerName: string;
  filePath: string;
};

type TippecanoeConfig = {
  geojsonConfig: string | TippecanoeLayer[];
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
 * @deprecated Trop compliqué à gérer pour plusieurs fichiers. utiliser generateTilesFromGeoJSON()
 */
export const generateTilesFromGeoJSONDockerLegacy = async (config: TippecanoeConfig) => {
  if (serverConfig.USE_DOCKER_GEO_COMMANDS) {
    const inputFileName = basename(config.geojsonConfig as string);
    const outputDirectoryName = 'output_tiles';
    await rename(config.geojsonConfig as string, join(dockerVolumePath, inputFileName));
    await runDocker(
      'naxgrp/tippecanoe',
      `tippecanoe -e ${outputDirectoryName} --layer=layer --force --generate-ids --minimum-zoom=${config.zoomMin} --maximum-zoom=${config.zoomMax} ${config.tippeCanoeArgs ?? ''} ${basename(inputFileName)}`,
      { captureOutput: !serverConfig.PRINT_TIPPECANOE_OUTPUT_TO_LOGS }
    );
    // input
    await rename(join(dockerVolumePath, inputFileName), config.geojsonConfig as string);
    // output
    await rename(join(dockerVolumePath, outputDirectoryName), config.outputDirectory);
  } else {
    await runBash(
      `tippecanoe -e ${config.outputDirectory} --layer=layer --force --generate-ids --minimum-zoom=${config.zoomMin} --maximum-zoom=${config.zoomMax} ${config.tippeCanoeArgs ?? ''} ${config.geojsonConfig}`,
      { captureOutput: !serverConfig.PRINT_TIPPECANOE_OUTPUT_TO_LOGS }
    );
  }
};

/**
 * Génère les tuiles sous forme de répertoire à partir d'un ou plusieurs fichiers GeoJSON.
 * Non compatible Docker pour simplifier les choses
 * @param config - Configuration des tuiles
 */
export const generateTilesFromGeoJSON = async (config: TippecanoeConfig) => {
  const inputArgs =
    typeof config.geojsonConfig === 'string'
      ? `--layer=layer ${config.geojsonConfig}`
      : config.geojsonConfig.map((c) => `-L${c.layerName}:${c.filePath}`).join(' ');
  await runBash(
    `tippecanoe -e ${config.outputDirectory} --force --generate-ids --minimum-zoom=${config.zoomMin} --maximum-zoom=${config.zoomMax} ${inputArgs} ${config.tippeCanoeArgs ?? ''}`,
    { captureOutput: !serverConfig.PRINT_TIPPECANOE_OUTPUT_TO_LOGS }
  );
};

/**
 * Importe un répertoire de tuiles (généré par tippecanoe) dans une table.
 * @param tilesDirectory - Répertoire des tuiles
 * @param destinationTable - Table de destination
 */
const importTilesDirectoryToTable = async (tilesDirectory: string, destinationTable: TilesTable) => {
  // Check if table exists by trying to query it
  try {
    await kdb.selectFrom(destinationTable).select(sql`1`.as('exists')).limit(1).execute();
    logger.info('flushing destination table', {
      table: destinationTable,
    });
    await kdb.deleteFrom(destinationTable).execute();
  } catch (err) {
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
      await kdb
        .insertInto(destinationTable as any)
        .values({
          tile: tileData,
          x: tile.x,
          y: tile.y,
          z: tile.z,
        })
        .onConflict((oc) => oc.columns(['x', 'y', 'z']).doUpdateSet({ tile: tileData }))
        .execute();
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
