import { logger } from '@helpers/logger';
import { readFile, readdir, stat } from 'fs/promises';
import { join } from 'path';
import db from 'src/db';
import { processInParallel } from 'src/types/async';

const QUERY_PARALLELISM = 50; // max queries in //

/**
 * Generate tiles from GeoJSON data and store them in a postgres table
 */
export const importMvtDirectory = async (
  basePath: string,
  destinationTable: string
) => {
  const startTime = Date.now();

  const zoomLevels = await listDirectoryEntries(basePath, 'dir');

  const tiles: { x: number; y: number; z: number; path: string }[] = [];
  await Promise.all(
    zoomLevels.map(async (zoomLevel) => {
      const columns = await listDirectoryEntries(
        join(basePath, zoomLevel),
        'dir'
      );
      await Promise.all(
        columns.map(async (column) => {
          const rows = await listDirectoryEntries(
            join(basePath, zoomLevel, column),
            'file'
          );
          rows.forEach((row) => {
            tiles.push({
              x: Number.parseInt(column),
              y: Number.parseInt(row),
              z: Number.parseInt(zoomLevel),
              path: join(basePath, zoomLevel, column, row),
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
          x: tile.x,
          y: tile.y,
          z: tile.z,
          tile: tileData,
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

async function listDirectoryEntries(
  basePath: string,
  type: 'dir' | 'file'
): Promise<string[]> {
  const entries = await readdir(basePath);
  const subEntries: string[] = [];

  await Promise.all(
    entries.map(async (name) => {
      const fileStats = await stat(join(basePath, name));
      if (
        (type === 'dir' && fileStats.isDirectory()) ||
        (type === 'file' && fileStats.isFile())
      ) {
        subEntries.push(name);
      }
    })
  );
  return subEntries;
}
