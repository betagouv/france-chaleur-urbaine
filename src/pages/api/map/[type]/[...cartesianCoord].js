import getTiles from 'src/services/tiles';

export default async function handleRequest(req, res) {
  const {
    cartesianCoord: [z, x, y],
    type,
  } = req.query;

  const tiles = await getTiles(type, +x, +y, +z);

  res.setHeader('Access-Control-Allow-Origin', '*');

  if (!tiles) {
    res.status(204).send();
    return;
  }

  res.setHeader('Content-Type', 'application/protobuf');
  res.status(200).send(tiles);
}
