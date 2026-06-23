import type { NextApiRequest, NextApiResponse } from 'next';

import { handleRouteErrors, requirePutMethod } from '@/server/helpers/server';
import { withCors } from '@/services/api/cors';

import { authenticatePartner } from '../authentication';
import { syncEngieUsers } from './engie-users-sync';

/**
 * `PUT /api/v1/users/{key}` — API héritée ENGIE, à décommissionner. Auth par token d'organisation
 * (`organization_api_credentials`, comme la v2) ; le `[key]` de l'URL est ignoré. Délègue à `syncEngieUsers`.
 */
const handler = handleRouteErrors(async (req: NextApiRequest, res: NextApiResponse) => {
  requirePutMethod(req);
  const auth = await authenticatePartner(req);

  try {
    await syncEngieUsers({ id: auth.organizationId, name: auth.organizationName }, req.body);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default withCors(handler);
