import { type NextApiRequest } from 'next';
import { z } from 'zod';

import { handleRouteErrors } from '@/server/helpers/server';
import { updatePerimetreDeDeveloppementPrioritaire } from '@/server/services/network';

const zBody = z.object({
  Identifiant_reseau: z.string().optional(),
  reseau_de_chaleur_id: z.number().optional(),
  reseau_en_construction_id: z.number().optional(),
});

const PATCH = async (req: NextApiRequest) => {
  const id = await z.coerce.number().parseAsync(req.query.id);
  const body = await zBody.parseAsync(req.body);
  await updatePerimetreDeDeveloppementPrioritaire(id, body);
};

export default handleRouteErrors(
  { PATCH },
  {
    requireAuthentication: ['admin'],
  }
);
