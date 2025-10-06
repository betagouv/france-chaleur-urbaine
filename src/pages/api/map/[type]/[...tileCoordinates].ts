import type { NextApiRequest, NextApiResponse } from 'next';
import zod from 'zod';

import { getTile } from '@/modules/tiles/server/service';
import { zDatabaseSourceId } from '@/modules/tiles/tiles.config';
import { handleRouteErrors, validateObjectSchema } from '@/server/helpers/server';

// disable the warning for this route as many tiles are bigger than the default 4MB threshold
export const config = {
  api: {
    responseLimit: false,
  },
};

export default handleRouteErrors(
  async function handleRequest(req: NextApiRequest, res: NextApiResponse) {
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
  },
  {
    logRequest: false,
  }
);
