import type { NextApiRequest, NextApiResponse } from 'next';
import z from 'zod';

import { handleRouteErrors, requirePutMethod } from '@/server/helpers/server';
import { createGestionnairesFromAPI } from '@/server/services/airtable';
import { apiUser } from '@/services/api/authentication';
import { withCors } from '@/services/api/cors';

const ApiNetworkValidation = z.object({
  id_sncu: z.string(),
  full_url: z.string(),
  public_name: z.string(),
  contacts: z.array(z.string().email().toLowerCase().trim()),
});
const ApiNetworksValidation = z.array(ApiNetworkValidation);

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

  const input = ApiNetworksValidation.safeParse(req.body);
  if (!input.success) {
    res.status(400).json(input.error);
    return;
  }

  const stats = await createGestionnairesFromAPI(account, input.data);
  return stats;
});

export default withCors(apiUsers);
