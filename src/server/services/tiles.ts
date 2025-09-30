import geojsonvt from 'geojson-vt';
import vtpbf from 'vt-pbf';

import { tileSourcesMaxZoom } from '@/components/Map/layers/common';
import { type AirtableTileInfo, type DatabaseSourceId, tilesInfo } from '@/modules/tiles/tiles.config';
import db from '@/server/db';
import base from '@/server/db/airtable';
import { isDefined } from '@/utils/core';

const debug = !!(process.env.API_DEBUG_MODE || null);

let airtableDayCached = 0;
const airtableTiles: Partial<Record<DatabaseSourceId, any>> = {
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
          properties: tileInfo.properties.reduce(
            function (acc: any, key: string) {
              const value = record.get(key);
              if (value) {
                acc[key] = value;
              }
              return acc;
            },
            { id: record.id }
          ),
        };
      });

      return geojsonvt(
        {
          type: 'FeatureCollection',
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore: Create proper type
          features,
        },
        {
          maxZoom: tileSourcesMaxZoom,
        }
      );
    });
};

const cacheAirtableTiles = () => {
  airtableDayCached = new Date().getDate();
  Object.entries(tilesInfo).forEach(([type, tileInfo]) => {
    if (tileInfo.source === 'airtable') {
      if (debug) console.info(`Indexing tiles for ${type} from airtable ${tileInfo.table}...`);
      getObjectIndexFromAirtable(tileInfo)
        .then((result) => {
          airtableTiles[type as DatabaseSourceId] = result;
          if (debug) console.info(`Indexing tiles for ${type} from airtable ${tileInfo.table} done`);
        })
        .catch((e) => debug && console.error(`Indexing tiles for ${type} from airtable ${tileInfo.table} failed`, e));
    }
  });
};

if (!isDefined(process.env.DISABLE_AIRTABLE_TILES_CACHE)) {
  cacheAirtableTiles();
}

const getTile = async (type: DatabaseSourceId, x: number, y: number, z: number): Promise<{ data: any; compressed: boolean } | null> => {
  const tileInfo = tilesInfo[type];
  if (tileInfo.source === 'database') {
    const result = await db(tileInfo.tiles).where('x', x).andWhere('y', y).andWhere('z', z).first();

    return result?.tile ? { data: result?.tile, compressed: !!tileInfo.compressedTiles } : null;
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
    ? {
        data: Buffer.from(vtpbf.fromGeojsonVt({ [tileInfo.sourceLayer]: tile }, { version: 2 })),
        compressed: false,
      }
    : null;
};

export default getTile;
