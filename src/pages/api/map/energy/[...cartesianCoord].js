import mapParam from '@components/Map';
import geojsonvt from 'geojson-vt';
import vtpbf from 'vt-pbf';
import { readFileAsync, readSplitFileAsync } from '../helper';

const API_DEBUG_MODE = !!(process.env.API_DEBUG_MODE || null);

const { maxZoom, minZoomData } = mapParam;

const path = './public/geojson/';
const filepaths = {
  condominiumRegister: {
    filename: 'registre_copro.geojson',
    minZoom: minZoomData,
    multipart: true,
  },
};

const tileOptions = {
  maxZoom,
};

const getObjectIndex = async (debug) => {
  const tileIndexPromises = Object.entries(filepaths).map(
    ([key, { filename, featuresFilter, multipart }]) => {
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
  const { cartesianCoord } = req.query;
  const [z, x, y] = cartesianCoord;
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
