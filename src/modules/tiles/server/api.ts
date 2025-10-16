import type { NextApiRequest, NextApiResponse } from 'next';
import zod from 'zod';

import { handleRouteErrors, validateObjectSchema } from '@/server/helpers/server';
import { zDatabaseSourceId } from '../tiles.config';
import { getTile } from './service';

const GET = async (req: NextApiRequest, res: NextApiResponse) => {
  const {
    type,
    tileCoordinates: [z, x, y],
  } = await validateObjectSchema(req.query, {
    tileCoordinates: zod.array(zod.coerce.number()).length(3),
    type: zDatabaseSourceId,
  });

  const tile = await getTile(type, x, y, z);
  if (!tile) {
    res.status(204).end();
    return;
  }

  if (tile.compressed) {
    res.setHeader('Content-Encoding', 'gzip');
  }
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/protobuf');
  res.status(200).send(tile.data);
};

export default handleRouteErrors(
  { GET },
  {
    logRequest: false,
  }
);
