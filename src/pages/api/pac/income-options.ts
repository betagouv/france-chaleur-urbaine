import type { NextApiRequest, NextApiResponse } from 'next';

import { zIncomeOptionsInput } from '@/modules/pac/constants';
import { getIncomeOptions } from '@/modules/pac/server/simulation-service';
import { createNextApiRateLimiter } from '@/modules/security/server/rate-limit/next-pages';
import { handleRouteErrors, requirePostMethod } from '@/server/helpers/server';
import { withCors } from '@/services/api/cors';

// Public API consumed by an external simulator: per-IP limit well above a human usage, below a scraping one
const rateLimiter = createNextApiRateLimiter({ limit: 60, path: '/api/pac/income-options', windowMs: 60_000 });

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  requirePostMethod(req);
  await rateLimiter(req, res);

  return getIncomeOptions(zIncomeOptionsInput.parse(req.body));
};

export default withCors(handleRouteErrors(handler));
