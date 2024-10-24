import type { NextApiRequest } from 'next';
import { z } from 'zod';

import { getEligilityStatus } from '@core/infrastructure/repository/addresseInformation';
import { handleRouteErrors, requireGetMethod, validateObjectSchema } from '@helpers/server';
import { withCors } from 'src/services/api/cors';

const eligibilityStatus = handleRouteErrors(async (req: NextApiRequest) => {
  requireGetMethod(req);

  const { lat, lon, city } = await validateObjectSchema(req.query, {
    lat: z.coerce.number(),
    lon: z.coerce.number(),
    city: z.string(),
  });
  return await getEligilityStatus(lat, lon, city);
});

export default withCors(eligibilityStatus);
