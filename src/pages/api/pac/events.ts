import type { NextApiRequest, NextApiResponse } from 'next';

import { zSimulateurPacEventInput } from '@/modules/pac/constants';
import { recordSimulateurPacEvent } from '@/modules/pac/server/tracking-service';
import { createNextApiRateLimiter } from '@/modules/security/server/rate-limit/next-pages';
import { handleRouteErrors, requirePostMethod } from '@/server/helpers/server';
import { withCors } from '@/services/api/cors';

const rateLimiter = createNextApiRateLimiter({ limit: 120, path: '/api/pac/events', windowMs: 60_000 });

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  requirePostMethod(req);
  await rateLimiter(req, res);

  return recordSimulateurPacEvent(zSimulateurPacEventInput.parse(req.body));
};

export default withCors(handleRouteErrors(handler, { logRequest: false }));
