import { readFile } from 'fs/promises';

import geojsonvt from 'geojson-vt';
import vtpbf from 'vt-pbf';

import db from '@/server/db';
import { logger } from '@/server/helpers/logger';
import { processInParallel } from '@/types/async';

const QUERY_PARALLELISM = 50; // max queries in //

// probably custom bounds around France
const globalX13Min = 3900;
const globalX13Max = 4400;
const globalY13Min = 2700;
const globalY13Max = 3100;

/**
 * Generate tiles from GeoJSON data and store them in a postgres table
 */
export const generateTilesFromGeoJSON = async (geojson: GeoJSON.GeoJSON, destinationTable: string, zoomMin: number, zoomMax: number) => {
  const startTime = Date.now();
  logger.info('start generating vector tiles');
  const tiles = geojsonvt(geojson, {
    maxZoom: zoomMax,
  });
  logger.info('finished generating vector tiles', {
    duration: Date.now() - startTime,
  });

  for (let z = zoomMin; z <= zoomMax; z++) {
    const startTime = Date.now();
    logger.info('start level', { zLevel: z });

    await processInParallel(getCoordinatesGenerator(z), QUERY_PARALLELISM, async ({ x, y, z }) => {
      const tile = tiles.getTile(z, x, y);
      if (tile) {
        await db(destinationTable)
          .insert({
            x,
            y,
            z,
            tile: Buffer.from(vtpbf.fromGeojsonVt({ layer: tile }, { version: 2 })),
          })
          .onConflict(['x', 'y', 'z'])
          .ignore();
      }
    });

    logger.info('finished level', {
      zLevel: z,
      duration: Date.now() - startTime,
    });
  }
};

export const generateFromFile = async (fileName: string, destinationTable: string, zoomMin: number, zoomMax: number) => {
  const geojson = JSON.parse(await readFile(fileName, 'utf8'));

  logger.info('start importing geojson features', {
    count: geojson.features?.length,
  });

  if (!(await db.schema.hasTable(destinationTable))) {
    logger.info('destination table does not exist, creating it', {
      table: destinationTable,
    });
    await db.schema.createTable(destinationTable, (table) => {
      table.bigInteger('x').notNullable();
      table.bigInteger('y').notNullable();
      table.bigInteger('z').notNullable();
      table.specificType('tile', 'bytea').notNullable();
      table.primary(['x', 'y', 'z']);
    });
  }

  logger.info('flushing table', { table: destinationTable });
  await db(destinationTable).delete();

  await generateTilesFromGeoJSON(geojson, destinationTable, zoomMin, zoomMax);
};

/**
 * Return a generator that generates tile coordinates of a specific zoom level
 */
function* getCoordinatesGenerator(z: number) {
  const x13Min = globalX13Min;
  const x13Max = globalX13Max;
  const y13Min = globalY13Min;
  const y13Max = globalY13Max;
  const xMin = z < 13 ? 0 : x13Min * Math.pow(2, z - 13);
  const xMax = z < 13 ? Math.pow(2, z) : x13Max * Math.pow(2, z - 13);
  const yMin = z < 13 ? 0 : y13Min * Math.pow(2, z - 13);
  const yMax = z < 13 ? Math.pow(2, z) : y13Max * Math.pow(2, z - 13);
  for (let x = xMin; x < xMax; x++) {
    for (let y = yMin; y < yMax; y++) {
      yield { x, y, z };
    }
  }
}
