import type { NextApiRequest, NextApiResponse } from 'next';

import { zHeatingSimulationInput } from '@/modules/pac/constants';
import { getHeatingSimulation } from '@/modules/pac/server/simulation-service';
import { createNextApiRateLimiter } from '@/modules/security/server/rate-limit/next-pages';
import { handleRouteErrors, requirePostMethod } from '@/server/helpers/server';
import { withCors } from '@/services/api/cors';

// Public API consumed by an external simulator: per-IP limit well above a human usage, below a scraping one
const rateLimiter = createNextApiRateLimiter({ limit: 60, path: '/api/pac/simulation', windowMs: 60_000 });

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  requirePostMethod(req);
  await rateLimiter(req, res);

  return getHeatingSimulation(zHeatingSimulationInput.parse(req.body));
};

export default withCors(handleRouteErrors(handler));
