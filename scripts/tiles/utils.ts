import { readFile } from 'fs/promises';

import geojsonvt from 'geojson-vt';
import vtpbf from 'vt-pbf';

import db from '@/server/db';
import { logger } from '@/server/helpers/logger';
import { type DatabaseSourceId, type DatabaseTileInfo, preTable, tilesInfo } from '@/server/services/tiles.config';
import { processInParallel } from '@/types/async';

const QUERY_PARALLELISM = 50; // max queries in //

// probably custom bounds around France
const maxIndex = 23465952;
const globalX13Min = 3900;
const globalX13Max = 4400;
const globalY13Min = 2700;
const globalY13Max = 3100;

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
