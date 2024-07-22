import type { NextApiRequest } from 'next';
import { z } from 'zod';

import { updateDemand } from '@core/infrastructure/repository/manager';
import { handleRouteErrors, requirePutMethod, validateObjectSchema } from '@helpers/server';
import { DEMANDE_STATUS } from 'src/types/enum/DemandSatus';

const zDemandUpdate = {
  Status: z.nativeEnum(DEMANDE_STATUS).optional(),
  'Prise de contact': z.boolean().optional(),
  'Gestionnaire Distance au réseau': z.number().optional(),
  'Gestionnaire Logement': z.number().optional(),
  'Gestionnaire Conso': z.number().optional(),
  Commentaire: z.string().optional(),
  'Gestionnaire Affecté à': z.string().optional(),
  'Emails envoyés': z.string().optional(),
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
    requireAuthentication: ['gestionnaire'],
  }
);
