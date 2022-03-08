import geojsonvt from 'geojson-vt';
import vtpbf from 'vt-pbf';
import { readFileAsync, readSplitFileAsync } from '../helper';

const path = './public/geojson/';
const filepaths = {
  outline: {
    filename:
      'dataset-1641576913364-[Trace-des-reseaux-de-chaleur-en-Ile-de-France].geojson',
  },
  substation: {
    filename:
      'dataset-1642417907427-[Sous-stations-des-reseaux-de-chaleur-Ile-de-France].geojson',
  },
  boilerRoom: {
    filename:
      'dataset-1642417995651-[Chaufferies-des-reseaux-de-chaleur-en-Ile-de-France].geojson',
  },
};

const tileOptions = {
  maxZoom: 18,
  tolerance: 20,
};

const getObjectIndex = async () => {
  const tileIndexPromises = Object.entries(filepaths).map(
    ([key, { filename, featuresFilter, multipart }]) => {
      return (
        multipart
          ? readSplitFileAsync(path, filename, true)
          : readFileAsync(`${path}${filename}`, true)
      ).then((rawdata) => {
        console.info(
          'Convert string to Json ...',
          typeof rawdata,
          rawdata.length
        );
        const geoJSON = JSON.parse(rawdata);
        console.info('geoJson-ized', key);

        if (featuresFilter) {
          geoJSON.features = geoJSON.features.filter(featuresFilter);
        }

        const tileIndex = geojsonvt(geoJSON, tileOptions);
        console.info('tileIndex-ized', typeof tileIndex);
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
const objTileIndexPromise = getObjectIndex().then(
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

  const buffer = Buffer.from(vtpbf.fromGeojsonVt(tiles));
  res.setHeader('Content-Type', 'application/protobuf');
  res.status(200).send(buffer);
}
