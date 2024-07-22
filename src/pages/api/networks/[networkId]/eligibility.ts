import type { NextApiRequest } from 'next';
import { z } from 'zod';

import { getNetworkEligilityStatus } from '@core/infrastructure/repository/addresseInformation';
import { handleRouteErrors, requireGetMethod, validateObjectSchema } from '@helpers/server';
import { withCors } from 'src/services/api/cors';

export default withCors(
  handleRouteErrors(async (req: NextApiRequest) => {
    requireGetMethod(req);

    const { networkId, lat, lon } = await validateObjectSchema(req.query, {
      networkId: z.string(),
      lat: z.coerce.number(),
      lon: z.coerce.number(),
    });
    return await getNetworkEligilityStatus(networkId, lat, lon);
  })
);
