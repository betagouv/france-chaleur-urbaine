import type { NextApiRequest, NextApiResponse } from 'next';
import z from 'zod';

import { handleRouteErrors, requirePutMethod } from '@/server/helpers/server';
import { upsertUsersFromApi } from '@/server/services/airtable';
import { apiUser } from '@/services/api/authentication';
import { withCors } from '@/services/api/cors';

const ApiNetworkValidation = z.object({
  id_sncu: z.string(),
  contacts: z.array(z.string().email().toLowerCase().trim()),
});
const ApiNetworksValidation = z.array(ApiNetworkValidation);
export type ApiNetwork = z.infer<typeof ApiNetworkValidation>;

// Appelé par ENGIE tous les vendredi à 12h
// Développeur julien@clic-droit.fr et Responsable Digital Opérationnel chez ENGIE clement.neyrand@engie.com
const apiUsers = handleRouteErrors(async (req: NextApiRequest, res: NextApiResponse) => {
  requirePutMethod(req);

  const account = await apiUser(req, res);
  if (!account) {
    return;
  }

  const input = ApiNetworksValidation.safeParse(req.body);
  if (!input.success) {
    res.status(400).json(input.error);
    return;
  }

  const warnings = await upsertUsersFromApi(account, input.data);
  return warnings.length > 0 ? { warnings } : null;
});

export default withCors(apiUsers);
