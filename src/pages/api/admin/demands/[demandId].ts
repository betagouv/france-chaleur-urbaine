import type { NextApiRequest } from 'next';
import { z } from 'zod';

import { handleRouteErrors, requirePutMethod, validateObjectSchema } from '@/server/helpers/server';
import { updateDemand } from '@/server/services/manager';

const zDemandUpdate = {
  'Gestionnaires validés': z.boolean().optional(),
  Gestionnaires: z.array(z.string()).optional(),
  Commentaire: z.string().optional(),
  Commentaires_internes_FCU: z.string().optional(),
};

export type DemandUpdate = z.infer<z.ZodObject<typeof zDemandUpdate>>;

export default handleRouteErrors(
  async (req: NextApiRequest) => {
    requirePutMethod(req);

    const demandUpdate = await validateObjectSchema(req.body, zDemandUpdate);

    const demand = await updateDemand(req.user, req.query.demandId as string, demandUpdate);
    return demand;
  },
  {
    requireAuthentication: ['admin'],
  }
);
