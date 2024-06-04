import { getEligilityStatus } from '@core/infrastructure/repository/addresseInformation';
import {
  handleRouteErrors,
  requireGetMethod,
  validateObjectSchema,
} from '@helpers/server';
import type { NextApiRequest } from 'next';
import { withCors } from 'src/services/api/cors';
import { z } from 'zod';

const eligibilityStatus = handleRouteErrors(async (req: NextApiRequest) => {
  requireGetMethod(req);

  const { lat, lon } = await validateObjectSchema(req.query, {
    lat: z.coerce.number(),
    lon: z.coerce.number(),
    city: z.string(),
  });
  return await getEligilityStatus(lat, lon);
});

export default withCors(eligibilityStatus);
