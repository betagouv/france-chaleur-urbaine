import { readdir, readFile, stat } from 'fs/promises';
import { arch } from 'node:os';
import { join } from 'path';

import geojsonvt from 'geojson-vt';
import vtpbf from 'vt-pbf';

import db from '@/server/db';
import { logger } from '@/server/helpers/logger';
import { type DatabaseSourceId, type DatabaseTileInfo, preTable, tilesInfo } from '@/server/services/tiles.config';
import { processInParallel } from '@/types/async';

import { dockerVolumePath, moveFile, runBash, runDocker } from '../helpers/shell';

const QUERY_PARALLELISM = 50; // max queries in //

// probably custom bounds around France
const maxIndex = 23465952;
const globalX13Min = 3900;
const globalX13Max = 4400;
const globalY13Min = 2700;
const globalY13Max = 3100;

/**
 * Generate tiles from GeoJSON data and store them in a postgres table
 */
export const importTilesDirectory = async (basePath: string, destinationTable: string) => {
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

async function listDirectoryEntries(basePath: string, type: 'dir' | 'file'): Promise<string[]> {
  const entries = await readdir(basePath);
  const subEntries: string[] = [];

  await Promise.all(
    entries.map(async (name) => {
      const fileStats = await stat(join(basePath, name));
      if ((type === 'dir' && fileStats.isDirectory()) || (type === 'file' && fileStats.isFile())) {
        subEntries.push(name);
      }
    })
  );
  return subEntries;
}

const geoJSONQuery = (properties: string[], id: string) =>
  db.raw(
    `json_build_object(
    'type', 'FeatureCollection',
    'features', json_agg(json_build_object(
      'id', "${id}",
      'type', 'Feature',
      'geometry', ST_AsGeoJSON(ST_ForcePolygonCCW(ST_Transform(geom,4326)))::json,
      'properties', json_build_object(
        ${properties.flatMap((property) => [`'${property}'`, `"${property}"`]).join(',')}
      )
    ))
  )`
  );

const dbTable = (
  table: string,
  region?: string,
  limitRowIDMin?: number,
  limitRowIDMax?: number,
  xmin?: number,
  xmax?: number,
  ymin?: number,
  ymax?: number
) => {
  if (region && preTable(region)[table]) {
    return db(table).with(
      table,
      db.raw(
        `${preTable(region)[table]}${
          limitRowIDMin
            ? `AND id BETWEEN ${limitRowIDMin} AND ${limitRowIDMax}
               AND ST_INTERSECTS(
                ST_Transform(geom, 3857),
                ST_MakeEnvelope(${xmin}, ${ymin}, ${xmax}, ${ymax}, 3857)
              )
            `
            : ''
        }`
      )
    );
  }
  return db(table);
};

const tileToEnvelope = (x: number, y: number, z: number) => {
  const worldMercMax = 20037508.3427892;
  const worldMercMin = -1 * worldMercMax;
  const worldMercSize = worldMercMax - worldMercMin;

  const worldTileSize = 2 ** z;
  const tileMercSize = worldMercSize / worldTileSize;

  const xmin = worldMercMin + tileMercSize * x;
  const xmax = worldMercMin + tileMercSize * (x + 1);
  const ymin = worldMercMax - tileMercSize * y;
  const ymax = worldMercMax - tileMercSize * (y + 1);

  return {
    xmin: xmin - 1,
    xmax: xmax + 1,
    ymin: ymin - 1,
    ymax: ymax + 1,
  };
};

export const fillTiles = async (table: DatabaseSourceId, zoomMin: number, zoomMax: number, withIndex: boolean) => {
  for (let index = 0; index < (withIndex ? 320 : 1); index++) {
    let x13Min = globalX13Min;
    let x13Max = globalX13Max;
    let y13Min = globalY13Min;
    let y13Max = globalY13Max;
    if (withIndex) {
      console.log('Part', index + 1, '/', withIndex ? 320 : 1);
      const j = index % 16;
      const i = (index - j) / 16;
      x13Min = globalX13Min + i * 25;
      x13Max = x13Min + 25;
      y13Min = globalY13Min + j * 25;
      y13Max = y13Min + 25;
    }
    const tileInfo = tilesInfo[table] as DatabaseTileInfo;
    console.info('Load geojson from', tileInfo.table);
    console.time('geojson');
    let geoJSON;
    if (table === 'buildings' || table === 'energy') {
      const list: any[] = [];
      const { xmin, ymin } = tileToEnvelope(x13Min, y13Min, 13);
      const { xmax, ymax } = tileToEnvelope(x13Max, y13Max, 13);

      console.info('Compute region');
      const regions = await db('regions')
        .select('bnb_nom')
        .where(
          db.raw(`
        ST_Intersects(
          ST_Transform(geom, 3857),
          ST_MakeEnvelope(${xmin}, ${ymin}, ${xmax}, ${ymax}, 3857)
      )
      `)
        );
      console.info(regions.length, 'region(s) to search');
      if (regions.length === 0) {
        continue;
      }
      for (let r = 0; r < regions.length; r++) {
        const region = regions[r].bnb_nom;
        console.log('Region', region);
        console.time(region);
        for (let i = 1; i <= maxIndex; i += 250000) {
          console.info('Part', i);
          const tempGeoJSON = await tileInfo
            .extraWhere(
              dbTable(tileInfo.table, region, i, i + 250000 - 1, xmin, xmax, ymin, ymax).first(
                geoJSONQuery(tileInfo.properties, tileInfo.id)
              )
            )
            .whereNotNull('geom');
          const newList = tempGeoJSON.json_build_object.features;
          if (newList) {
            for (let i = 0, len = newList.length; i < len; i++) {
              list.push(newList[i]);
            }
          }
        }
        console.timeEnd(region);
      }
      geoJSON = {
        json_build_object: {
          type: 'FeatureCollection',
          features: list,
        },
      };
    } else {
      geoJSON = await tileInfo
        .extraWhere(dbTable(tileInfo.table).first(geoJSONQuery(tileInfo.properties, tileInfo.id)))
        .whereNotNull('geom');
    }
    console.timeEnd('geojson');
    console.time('tiles');
    console.info('Create tiles');
    const tiles = geojsonvt(geoJSON.json_build_object, {
      maxZoom: zoomMax,
    });
    geoJSON = null;
    console.timeEnd('tiles');
    for (let z = zoomMin; z <= zoomMax; z++) {
      console.time(`level ${z}`);
      console.info('Manage level', z);
      const xMin = z < 13 ? 0 : x13Min * Math.pow(2, z - 13);
      const xMax = z < 13 ? Math.pow(2, z) : x13Max * Math.pow(2, z - 13);
      const yMin = z < 13 ? 0 : y13Min * Math.pow(2, z - 13);
      const yMax = z < 13 ? Math.pow(2, z) : y13Max * Math.pow(2, z - 13);
      console.info(z, xMin, xMax, yMin, yMax);
      for (let x = xMin; x < xMax; x++) {
        for (let y = yMin; y < yMax; y++) {
          const tile = tiles.getTile(z, x, y);
          if (tile) {
            await db(tileInfo.tiles)
              .insert({
                x,
                y,
                z,
                tile: Buffer.from(vtpbf.fromGeojsonVt({ [tileInfo.sourceLayer]: tile }, { version: 2 })),
              })
              .onConflict(['x', 'y', 'z'])
              .ignore();
          }
        }
      }
      console.timeEnd(`level ${z}`);
    }
  }

  process.exit(0);
};

/**
 * Generate tiles from GeoJSON data and store them in a postgres table
 */
export const saveGeoJSONToTable = async (geojson: GeoJSON.GeoJSON, destinationTable: string, zoomMin: number, zoomMax: number) => {
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

export const importGeoJSONToTable = async (fileName: string, destinationTable: string, zoomMin: number, zoomMax: number) => {
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

  await saveGeoJSONToTable(geojson, destinationTable, zoomMin, zoomMax);
};

const dockerImageArch =
  arch() === 'arm64'
    ? 'arm64'
    : arch() === 'x64'
      ? 'amd64'
      : (() => {
          throw new Error(`Unsupported architecture: ${arch()}`);
        })();

export const generateGeoJSON = async (filepath: string) => {
  await runDocker(
    `ghcr.io/osgeo/gdal:alpine-normal-latest-${dockerImageArch}`,
    `ogr2ogr -f GeoJSON output.geojson PG:"host=localhost user=postgres dbname=postgres password=postgres_fcu" etudes_en_cours -t_srs EPSG:4326`
  );
  await moveFile(`${dockerVolumePath}/output.geojson`, filepath);

  return filepath;
};

export const importTilesDirectoryToTable = async (tilesDirectory: string, destinationTable: string) => {
  if (await db.schema.hasTable(destinationTable)) {
    logger.info('flushing destination table', {
      table: destinationTable,
    });
    await db(destinationTable).delete();
  } else {
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

  await importTilesDirectory(tilesDirectory, destinationTable);
};

export const importGeoJSONWithTipeeCanoe = async (fileName: string, destinationTable: string, zoomMin: number, zoomMax: number) => {
  const tilesDirectory = await generateTilesFromGeoJSON(fileName, destinationTable, zoomMin, zoomMax);
  await importTilesDirectory(tilesDirectory, destinationTable);
};

export const generateTilesFromGeoJSON = async (fileName: string, destinationTable: string, zoomMin: number, zoomMax: number) => {
  await runBash(
    `cat ${fileName} | docker run -i --rm --entrypoint /bin/bash naxgrp/tippecanoe -c "tippecanoe-json-tool" | docker run -i --rm -v ${dockerVolumePath}:/volume -w /volume --user $(id -u):$(id -g) --entrypoint /bin/bash naxgrp/tippecanoe -c "tippecanoe -e ${destinationTable} --read-parallel --layer=layer --force --generate-ids --minimum-zoom=${zoomMin} --maximum-zoom=${zoomMax}"`
  );
  return `${dockerVolumePath}/${destinationTable}`;
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
