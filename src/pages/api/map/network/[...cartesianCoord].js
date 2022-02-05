import geojsonvt from 'geojson-vt';
import vtpbf from 'vt-pbf';
import readJsonFile from '../helper/readJsonFile';

const filepaths = {
  outline:
    './public/geojson/dataset-1641576913364-[Trace-des-reseaux-de-chaleur-en-Ile-de-France].geojson',
  substation:
    './public/geojson/dataset-1642417907427-[Sous-stations-des-reseaux-de-chaleur-Ile-de-France].geojson',
  boilerRoom:
    './public/geojson/dataset-1642417995651-[Chaufferies-des-reseaux-de-chaleur-en-Ile-de-France].geojson',
};

const tileOptions = {
  maxZoom: 18,
  tolerance: 20,
};

const objTileIndex = Object.entries(filepaths).reduce((acc, [key, path]) => {
  const geoJSON = readJsonFile(path);
  const tileIndex = geojsonvt(geoJSON, tileOptions);
  return {
    ...acc,
    [key]: tileIndex,
  };
}, {});

export default async function handleRequest(req, res) {
  const { cartesianCoord } = req.query;
  const [z, x, y] = cartesianCoord;
  const tiles = Object.entries(objTileIndex).reduce((acc, [key, tileIndex]) => {
    const tile = tileIndex.getTile(+z, +x, +y);
    return tile
      ? {
          ...(acc || {}),
          [key]: tileIndex.getTile(+z, +x, +y),
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
