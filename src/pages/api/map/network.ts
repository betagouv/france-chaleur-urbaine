import type { NextApiRequest } from 'next';
import { z } from 'zod';

import { getNetwork } from '@core/infrastructure/repository/network';
import { handleRouteErrors, requireGetMethod, validateObjectSchema } from '@helpers/server';
import { withCors } from 'src/services/api/cors';

const eligibilityStatus = handleRouteErrors(async (req: NextApiRequest) => {
  requireGetMethod(req);

  const { identifiant } = await validateObjectSchema(req.query, {
    identifiant: z.string(),
  });
  return await getNetwork(identifiant);
});

export default withCors(eligibilityStatus);
