import mapParam from '@components/Map';
import geojsonvt from 'geojson-vt';
import vtpbf from 'vt-pbf';
import db from '../../../../db';

const { maxZoom } = mapParam;

const tileOptions = {
  maxZoom,
  tolerance: 0,
};

const getObjectIndex = async () => {
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

  return geojsonvt(geoJSON.json_build_object, tileOptions);
};

let objTileIndex = {};
const objTileIndexPromise = getObjectIndex().then(
  (tileIndex) => (objTileIndex = tileIndex)
);

export default async function handleRequest(req, res) {
  await objTileIndexPromise;
  const {
    cartesianCoord: [z, x, y],
  } = req.query;

  const tiles = { outline: objTileIndex.getTile(+z, +x, +y) };

  res.setHeader('Access-Control-Allow-Origin', '*');

  if (!tiles) {
    res.status(204).send();
    return;
  }

  const buffer = Buffer.from(vtpbf.fromGeojsonVt(tiles, { version: 2 }));
  res.setHeader('Content-Type', 'application/protobuf');
  res.status(200).send(buffer);
}
