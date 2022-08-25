import geojsonvt from 'geojson-vt';
import db from 'src/db';
import base from 'src/db/airtable';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: no types
import vtpbf from 'vt-pbf';
import mapParam from './Map/param';
import { AirtableTileInfo, DataType, tilesInfo } from './tiles.config';

const debug = !!(process.env.API_DEBUG_MODE || null);

let airtableDayCached = 0;
const airtableTiles: Partial<Record<DataType, any>> = {
  demands: null,
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

const cacheAirtableTiles = () => {
  airtableDayCached = new Date().getDate();
  Object.entries(tilesInfo).forEach(([type, tileInfo]) => {
    if (tileInfo.source === 'airtable') {
      debug &&
        console.info(
          `Indexing tiles for ${type} from airtable ${tileInfo.table}...`
        );
      getObjectIndexFromAirtable(tileInfo)
        .then((result) => {
          airtableTiles[type as DataType] = result;
          debug &&
            console.info(
              `Indexing tiles for ${type} from airtable ${tileInfo.table} done`
            );
        })
        .catch(
          (e) =>
            debug &&
            console.error(
              `Indexing tiles for ${type} from airtable ${tileInfo.table} failed`,
              e
            )
        );
    }
  });
};

cacheAirtableTiles();
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

  if (airtableDayCached !== new Date().getDate()) {
    cacheAirtableTiles();
  }

  const tiles = airtableTiles[type];
  if (!tiles) {
    return null;
  }

  const tile = tiles.getTile(z, x, y);

  return tile
    ? Buffer.from(
        vtpbf.fromGeojsonVt({ [tileInfo.sourceLayer]: tile }, { version: 2 })
      )
    : null;
};

export default getTiles;
