import mapParam from '@components/Map';
import geojsonvt from 'geojson-vt';
import vtpbf from 'vt-pbf';
import db from '../../../../db';
import { readFileAsync, readSplitFileAsync } from '../helper';

const API_DEBUG_MODE = !!(process.env.API_DEBUG_MODE || null);

const { maxZoom } = mapParam;

const path = './public/geojson/';
const filepaths = {
  outline: {
    filename: 'traces_rdch.geojson',
    table: 'potentiel_rcu — conso_potent_rcu_iris_2018',
  },
  substation: {
    filename: 'sous_stations_rdch.geojson',
  },
  boilerRoom: {
    filename: 'chaufferies-rdch.geojson',
  },
};

const tileOptions = {
  maxZoom,
  tolerance: 0,
};

const getObjectIndex = async (debug) => {
  const tileIndexPromises = Object.entries(filepaths).map(
    async ([key, { filename, table, featuresFilter, multipart }]) => {
      if (table) {
        const geoJSON = await db(
          'potentiel_rcu — l_traces_rdch_l_r11_2022_05_new'
        ).first(
          db.raw(`
            json_build_object(
              'type', 'FeatureCollection',
              'features', json_agg(json_build_object(
                'type', 'Feature',
                'geometry', ST_AsGeoJSON(ST_Transform(geom,4326))::json)
            ))
          `)
        );

        const tileIndex = geojsonvt(geoJSON.json_build_object, tileOptions);
        return [key, tileIndex];
      }
      return (
        multipart
          ? readSplitFileAsync(path, filename, !!API_DEBUG_MODE)
          : readFileAsync(`${path}${filename}`, !!API_DEBUG_MODE)
      ).then((rawdata) => {
        debug &&
          console.info(
            'Convert string to Json ...',
            typeof rawdata,
            rawdata.length
          );
        const geoJSON = JSON.parse(rawdata);
        debug && console.info('geoJson-ized', key);

        if (featuresFilter) {
          geoJSON.features = geoJSON.features.filter(featuresFilter);
        }

        const tileIndex = geojsonvt(geoJSON, tileOptions);
        debug && console.info('tileIndex-ized', typeof tileIndex);
        return [key, tileIndex];
      });
    }
  );
  return Promise.all(tileIndexPromises).then((tileIndexPromise) =>
    tileIndexPromise.reduce(
      (acc, [key, tileIndex]) => ({
        ...acc,
        [key]: tileIndex,
      }),
      {}
    )
  );
};

let objTileIndex = {};
const objTileIndexPromise = getObjectIndex(API_DEBUG_MODE).then(
  (tileIndex) => (objTileIndex = tileIndex)
);

export default async function handleRequest(req, res) {
  await objTileIndexPromise;
  const {
    cartesianCoord: [z, x, y],
  } = req.query;

  const tiles = Object.entries(objTileIndex).reduce((acc, [key, tileIndex]) => {
    const tile =
      filepaths[key]?.minZoom && filepaths[key]?.minZoom > +z
        ? null
        : tileIndex.getTile(+z, +x, +y);
    return tile
      ? {
          ...(acc || {}),
          [key]: tile,
        }
      : acc;
  }, null);

  res.setHeader('Access-Control-Allow-Origin', '*');

  if (!tiles) {
    res.status(204).send();
    return;
  }

  const buffer = Buffer.from(vtpbf.fromGeojsonVt(tiles, { version: 2 }));
  res.setHeader('Content-Type', 'application/protobuf');
  res.status(200).send(buffer);
}
