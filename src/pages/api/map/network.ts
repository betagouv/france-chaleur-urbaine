import type { NextApiRequest } from 'next';
import { z } from 'zod';

import { getNetwork } from '@/modules/reseaux/server/service';
import { handleRouteErrors, requireGetMethod, validateObjectSchema } from '@/server/helpers/server';
import { withCors } from '@/services/api/cors';

const eligibilityStatus = handleRouteErrors(async (req: NextApiRequest) => {
  requireGetMethod(req);

  const { identifiant } = await validateObjectSchema(req.query, {
    identifiant: z.string(),
  });
  return await getNetwork(identifiant);
});

export default withCors(eligibilityStatus);
