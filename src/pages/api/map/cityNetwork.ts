import type { NextApiRequest } from 'next';
import { z } from 'zod';

import { getCityEligilityStatus } from '@core/infrastructure/repository/addresseInformation';
import { handleRouteErrors, requireGetMethod, validateObjectSchema } from '@helpers/server';
import { withCors } from 'src/services/api/cors';

const cityNetwork = handleRouteErrors(async (req: NextApiRequest) => {
  requireGetMethod(req);

  const { city } = await validateObjectSchema(req.query, {
    city: z.string(),
  });
  return await getCityEligilityStatus(city);
});

export default withCors(cityNetwork);
