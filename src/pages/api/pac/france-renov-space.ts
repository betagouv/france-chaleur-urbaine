import type { NextApiRequest, NextApiResponse } from 'next';

import { getFranceRenovSpaceByCityCode } from '@/modules/chaleur-renouvelable/server/france-renov-spaces';
import { zFranceRenovSpaceInput } from '@/modules/pac/constants';
import { createNextApiRateLimiter } from '@/modules/security/server/rate-limit/next-pages';
import { handleRouteErrors, requirePostMethod } from '@/server/helpers/server';
import { withCors } from '@/services/api/cors';

// Public API consumed by an external simulator: per-IP limit well above a human usage, below a scraping one
const rateLimiter = createNextApiRateLimiter({ limit: 60, path: '/api/pac/france-renov-space', windowMs: 60_000 });

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  requirePostMethod(req);
  await rateLimiter(req, res);

  return getFranceRenovSpaceByCityCode(zFranceRenovSpaceInput.parse(req.body).cityCode);
};

export default withCors(handleRouteErrors(handler));
