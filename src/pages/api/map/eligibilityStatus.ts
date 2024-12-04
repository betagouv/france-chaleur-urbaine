import type { NextApiRequest } from 'next';
import { z } from 'zod';

import { handleRouteErrors, requireGetMethod, validateObjectSchema } from '@/server/helpers/server';
import { getEligilityStatus } from '@/server/services/addresseInformation';
import { withCors } from '@/services/api/cors';

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
