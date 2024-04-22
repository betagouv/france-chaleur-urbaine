import { getCityEligilityStatus } from '@core/infrastructure/repository/addresseInformation';
import {
  handleRouteErrors,
  requireGetMethod,
  validateObjectSchema,
} from '@helpers/server';
import type { NextApiRequest } from 'next';
import { withCors } from 'src/services/api/cors';
import { z } from 'zod';

const cityNetwork = handleRouteErrors(async (req: NextApiRequest) => {
  requireGetMethod(req);

  const { city } = await validateObjectSchema(req.query, {
    city: z.string(),
  });
  return await getCityEligilityStatus(city);
});

export default withCors(cityNetwork);
