import { getNetwork } from '@core/infrastructure/repository/network';
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

  const { identifiant } = await validateObjectSchema(req.query, {
    identifiant: z.string(),
  });
  return await getNetwork(identifiant);
});

export default withCors(eligibilityStatus);
