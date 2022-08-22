import geojsonvt from 'geojson-vt';
import db from 'src/db';
import base from 'src/db/airtable';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: no types
import vtpbf from 'vt-pbf';
import mapParam from './Map/param';
import { AirtableTileInfo, DataType, tilesInfo } from './tiles.config';

const debug = !!(process.env.API_DEBUG_MODE || null);
const allTiles: Record<DataType, any> = {
  demands: null,
  network: null,
  gas: null,
  energy: null,
  zoneDP: null,
  buildings: null,
};

const getObjectIndexFromAirtable = async (tileInfo: AirtableTileInfo) => {
  return base(tileInfo.table)
    .select()
    .all()
    .then((records) => {
      const features = records.map((record) => {
        const longitude = record.get('Longitude') as string;
        const latitude = record.get('Latitude') as string;
        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          properties: tileInfo.properties.reduce(function (
            acc: any,
            key: string
          ) {
            const value = record.get(key);
            if (value) {
              acc[key] = value;
            }
            return acc;
          },
          {}),
        };
      });

      return geojsonvt(
        {
          type: 'FeatureCollection',
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore: Create proper type
          features: features,
        },
        {
          maxZoom: mapParam.maxZoom,
        }
      );
    });
};

Object.entries(tilesInfo).forEach(([type, tileInfo]) => {
  if (tileInfo.source === 'airtable') {
    debug &&
      console.info(`Indexing tiles for ${type} with ${tileInfo.table}...`);
    getObjectIndexFromAirtable(tileInfo)
      .then((result) => {
        allTiles[type as DataType] = result;
        debug &&
          console.info(
            `Indexing tiles for ${type} with ${tileInfo.table} done`
          );
      })
      .catch(
        (e) =>
          debug &&
          console.error(
            `Indexing tiles for ${type} with ${tileInfo.table} failed`,
            e
          )
      );
  }
});

const getTiles = async (type: DataType, x: number, y: number, z: number) => {
  const tileInfo = tilesInfo[type];
  if (tileInfo.source === 'database') {
    const result = await db(tileInfo.tiles)
      .where('x', x)
      .andWhere('y', y)
      .andWhere('z', z)
      .first();

    return result?.tile;
  }
  const tiles = allTiles[type];
  if (!tiles) {
    return null;
  }

  const tile = tiles.getTile(z, x, y);
  return Buffer.from(
    vtpbf.fromGeojsonVt({ [tileInfo.sourceLayer]: tile }, { version: 2 })
  );
};

export default getTiles;
