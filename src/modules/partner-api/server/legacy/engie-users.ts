import type { NextApiRequest, NextApiResponse } from 'next';

import { handleRouteErrors, invalidPermissionsError, requirePutMethod } from '@/server/helpers/server';
import { withCors } from '@/services/api/cors';

import { authenticatePartner, type PartnerAuth } from '../authentication';
import { syncEngieUsers } from './engie-users-sync';

/**
 * Seule organisation autorisée à synchroniser ses comptes : la synchro crée des gestionnaires et leur donne des
 * permissions sur des réseaux désignés par SNCU, elle ne doit donc pas être ouverte aux autres jetons partenaires.
 * Comparaison sur le nom de l'organisation (renommer ENGIE dans l'admin coupe la synchro : échec fermé, 403).
 */
export const ENGIE_ORGANIZATION_NAME = 'ENGIE';

export const ensureEngieOrganization = (auth: PartnerAuth) => {
  if (auth.organizationName !== ENGIE_ORGANIZATION_NAME) {
    throw invalidPermissionsError;
  }
};

/**
 * `PUT /api/v1/users/{key}` — API héritée ENGIE, à décommissionner. Auth par token d'organisation
 * (`organization_api_credentials`, comme la v2), réservée à l'organisation ENGIE ; le `[key]` de l'URL est ignoré.
 * Délègue à `syncEngieUsers`.
 */
const handler = handleRouteErrors(async (req: NextApiRequest, res: NextApiResponse) => {
  requirePutMethod(req);
  const auth = await authenticatePartner(req);
  ensureEngieOrganization(auth);

  try {
    await syncEngieUsers({ id: auth.organizationId, name: auth.organizationName }, req.body);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default withCors(handler);
