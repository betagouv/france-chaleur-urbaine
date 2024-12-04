import type { NextApiRequest } from 'next';
import { z } from 'zod';

import { handleRouteErrors, requireGetMethod, validateObjectSchema } from '@/server/helpers/server';
import { getCityEligilityStatus } from '@/server/services/addresseInformation';
import { withCors } from '@/services/api/cors';

const cityNetwork = handleRouteErrors(async (req: NextApiRequest) => {
  requireGetMethod(req);

  const { city } = await validateObjectSchema(req.query, {
    city: z.string(),
  });
  return await getCityEligilityStatus(city);
});

export default withCors(cityNetwork);
