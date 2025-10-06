import type { NextApiRequest } from 'next';
import { z } from 'zod';

import { handleRouteErrors, validateObjectSchema } from '@/server/helpers/server';
import { updateDemand } from '@/server/services/manager';
import { DEMANDE_STATUS } from '@/types/enum/DemandSatus';

const zDemandUpdate = {
  Commentaire: z.string().optional(),
  'Emails envoyés': z.string().optional(),
  'Gestionnaire Affecté à': z.string().optional(),
  'Gestionnaire Conso': z.number().optional(),
  'Gestionnaire Distance au réseau': z.number().optional(),
  'Gestionnaire Logement': z.number().optional(),
  'Prise de contact': z.boolean().optional(),
  Status: z.nativeEnum(DEMANDE_STATUS).optional(),
  'Surface en m2': z.number().optional(),
};

export type DemandUpdate = z.infer<z.ZodObject<typeof zDemandUpdate>>;

const PUT = async (req: NextApiRequest) => {
  const demandUpdate = await validateObjectSchema(req.body, zDemandUpdate);

  const demand = await updateDemand(req.user, req.query.demandId as string, demandUpdate);
  return demand;
};

export default handleRouteErrors(
  { PUT },
  {
    requireAuthentication: ['gestionnaire', 'demo'],
  }
);
