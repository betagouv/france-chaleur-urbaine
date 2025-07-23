import type { NextApiRequest, NextApiResponse } from 'next';

import { getApiHandler } from '@/server/api/users';
import { handleRouteErrors, requirePutMethod } from '@/server/helpers/server';
import { apiUser } from '@/services/api/authentication';
import { withCors } from '@/services/api/cors';

/**
 * Appelé par ENGIE tous les vendredi à 12h
 * Développeur julien@clic-droit.fr et Responsable Digital Opérationnel chez ENGIE clement.neyrand@engie.com
 *
 * Sample message sent
 * [
    {
        "id_sncu": "8002C",
        "full_url": "https://rezomee.fr/amiens-energies",
        "public_name": "Amiens Energies",
        "contacts": [
            "sample@amiens-energies.com",
            "sample@external.engie.com"
        ]
    },
    {
        "id_sncu": "7107C",
        "full_url": "https://rezomee.fr/macon-energies-services",
        "public_name": "Mâcon Energies Services",
        "contacts": [
            "sample@engie.com"
        ]
    },
 */
const apiUsers = handleRouteErrors(async (req: NextApiRequest, res: NextApiResponse) => {
  requirePutMethod(req);

  const account = await apiUser(req, res);
  if (!account) {
    return;
  }

  const apiHandler = getApiHandler(account);

  try {
    await apiHandler.handleData(req.body);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    return;
  }
});

export default withCors(apiUsers);
