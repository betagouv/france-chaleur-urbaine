import getTiles from 'src/services/tiles';
import vtpbf from 'vt-pbf';

export default async function handleRequest(req, res) {
  const {
    cartesianCoord: [z, x, y],
    type,
  } = req.query;

  const tiles = getTiles(type, +x, +y, +z);

  res.setHeader('Access-Control-Allow-Origin', '*');

  if (!tiles) {
    res.status(204).send();
    return;
  }

  const buffer = Buffer.from(vtpbf.fromGeojsonVt(tiles, { version: 2 }));
  res.setHeader('Content-Type', 'application/protobuf');
  res.status(200).send(buffer);
}
