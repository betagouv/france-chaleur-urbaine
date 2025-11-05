import type { NextApiRequest } from 'next';
import { z } from 'zod';
import * as demandsService from '@/modules/demands/server/demands-service';
import { createUserEvent } from '@/modules/events/server/service';
import { handleRouteErrors, validateObjectSchema } from '@/server/helpers/server';
import type { AdminDemand } from '@/types/Summary/Demand';

const zDemandUpdate = {
  'Affecté à': z.string().nullable().optional(),
  Commentaire: z.string().optional(),
  Commentaires_internes_FCU: z.string().optional(),
  'Distance au réseau': z.number().nullable().optional(),
  Gestionnaires: z.array(z.string()).optional(),
  'Gestionnaires validés': z.boolean().optional(),
  'Identifiant réseau': z.string().optional(),
  'Nom réseau': z.string().optional(),
  'Relance à activer': z.boolean().optional(),
} satisfies Partial<Record<keyof AdminDemand, z.ZodType<any>>>;

export type DemandUpdate = z.infer<z.ZodObject<typeof zDemandUpdate>>;

const PUT = async (req: NextApiRequest) => {
  const demandUpdate = await validateObjectSchema(req.body, zDemandUpdate);

  // airtable types don't support null values but the API does
  await demandsService.update(req.query.demandId as string, demandUpdate as any);
  await createUserEvent({
    author_id: req.user.id,
    context_id: req.query.demandId as string,
    context_type: 'demand',
    data: demandUpdate,
    type: demandUpdate['Gestionnaires validés'] ? 'demand_assigned' : 'demand_updated',
  });
};

const DELETE = async (req: NextApiRequest) => {
  await demandsService.remove(req.query.demandId as string);
  await createUserEvent({
    author_id: req.user.id,
    context_id: req.query.demandId as string,
    context_type: 'demand',
    type: 'demand_deleted',
  });
};

export default handleRouteErrors(
  { DELETE, PUT },
  {
    requireAuthentication: ['admin'],
  }
);
