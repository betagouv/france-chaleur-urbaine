// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore: no types
import geojsonvt from 'geojson-vt';
import vtpbf from 'vt-pbf';
import db from '../src/db';
import {
  DatabaseTileInfo,
  DataType,
  preTable,
  tilesInfo,
} from '../src/services/tiles.config';

const geoJSONQuery = (properties: string[]) =>
  db.raw(
    `json_build_object(
    'type', 'FeatureCollection',
    'features', json_agg(json_build_object(
      'type', 'Feature',
      'geometry', ST_AsGeoJSON(ST_ForcePolygonCCW(ST_Transform(geom,4326)))::json,
      'properties', json_build_object(
        ${properties
          .flatMap((property) => [`'${property}'`, property])
          .join(',')}
      )
    ))
  )`
  );

const dbTable = (
  table: string,
  limitRowIDMin?: number,
  limitRowIDMax?: number
) => {
  if (preTable[table]) {
    return db(table).with(
      table,
      db.raw(
        `${preTable[table]}${
          limitRowIDMin &&
          `AND rowid BETWEEN ${limitRowIDMin} AND ${limitRowIDMax}`
        }`
      )
    );
  }
  return db(table);
};

const x13Min = 3900;
const x13Max = 4400;
const y13Min = 2700;
const y13Max = 3100;
const fillTiles = async (table: DataType, zoomMin: number, zoomMax: number) => {
  const tileInfo = tilesInfo[table] as DatabaseTileInfo;
  console.info('Load geojson from', tileInfo.table);
  console.time('geojson');
  let geoJSON;
  if (table === 'buildings') {
    geoJSON = {
      json_build_object: {
        type: 'FeatureCollection',
        features: [],
      },
    };
    for (let i = 1; i <= 1668457; i += 100000) {
      console.info('Part', i);
      const tempGeoJSON = await tileInfo
        .extraWhere(
          dbTable(tileInfo.table, i, i + 100000 - 1).first(
            geoJSONQuery(tileInfo.properties)
          )
        )
        .whereNotNull('geom');
      if (tempGeoJSON.json_build_object.features) {
        geoJSON.json_build_object.features =
          geoJSON.json_build_object.features.concat(
            tempGeoJSON.json_build_object.features
          );
      }
    }
  } else {
    geoJSON = await tileInfo
      .extraWhere(
        dbTable(tileInfo.table).first(geoJSONQuery(tileInfo.properties))
      )
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
          // const tile = await getTile(tileInfo, x, y, z);
          await db(tileInfo.tiles)
            .insert({
              x,
              y,
              z,
              tile: Buffer.from(
                vtpbf.fromGeojsonVt(
                  { [tileInfo.sourceLayer]: tile },
                  { version: 2 }
                )
              ),
            })
            .onConflict(['x', 'y', 'z'])
            .ignore();
        }
      }
    }
    console.timeEnd(`level ${z}`);
  }

  process.exit(0);
};

if (process.argv.length !== 5) {
  console.info(
    'Usage: export NODE_PATH=./ && ts-node scripts/fillTiles.ts table zoomMin zoomMax'
  );
  process.exit(1);
}

const table = process.argv[2];
const zoomMin = process.argv[3];
const zoomMax = process.argv[4];

fillTiles(table as DataType, parseInt(zoomMin), parseInt(zoomMax));
