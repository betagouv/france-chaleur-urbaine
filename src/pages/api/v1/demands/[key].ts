import type { NextApiRequest, NextApiResponse } from 'next';

import { handleRouteErrors, requireGetMethod } from '@/server/helpers/server';
import { apiUser } from '@/services/api/authentication';
import { withCors } from '@/services/api/cors';

const demands = handleRouteErrors(async (req: NextApiRequest, res: NextApiResponse) => {
  requireGetMethod(req);

  const account = await apiUser(req, res);
  if (!account) {
    return;
  }

  res.status(410).json({
    error: 'API décommissionnée',
    message:
      'Cette API est obsolète depuis avril 2026. Si vous en aviez encore besoin, merci de nous contacter via https://france-chaleur-urbaine.beta.gouv.fr/contact',
  });
});

export default withCors(demands);
