import { NextApiRequest, NextApiResponse } from 'next';
import getTiles from 'src/services/tiles';
import { zDataType } from 'src/services/tiles.config';
import zod from 'zod';

// disable the warning for this route as many tiles are bigger than the default 4MB threshold
export const config = {
  api: {
    responseLimit: false,
  },
};

export default async function handleRequest(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { type, tileCoordinates } = zod
    .object({
      type: zDataType,
      tileCoordinates: zod.array(zod.coerce.number()).length(3),
    })
    .parse(req.query);
  const [z, x, y] = tileCoordinates;
  const tiles = await getTiles(type, x, y, z);

  res.setHeader('Access-Control-Allow-Origin', '*');

  if (!tiles) {
    res.status(204).end();
    return;
  }

  res.setHeader('Content-Type', 'application/protobuf');
  res.status(200).send(tiles);
}
