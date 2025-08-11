import type { NextApiRequest } from 'next';
import { z } from 'zod';

import { AirtableDB } from '@/server/db/airtable';
import { handleRouteErrors, validateObjectSchema } from '@/server/helpers/server';
import { createUserEvent } from '@/server/services/events';
import { type AdminDemand } from '@/types/Summary/Demand';

const zDemandUpdate = {
  Gestionnaires: z.array(z.string()).optional(),
  'Affecté à': z.string().nullable().optional(),
  'Gestionnaires validés': z.boolean().optional(),
  'Distance au réseau': z.number().nullable().optional(),
  'Identifiant réseau': z.string().optional(),
  'Nom réseau': z.string().optional(),
  'Relance à activer': z.boolean().optional(),
  Commentaire: z.string().optional(),
  Commentaires_internes_FCU: z.string().optional(),
} satisfies Partial<Record<keyof AdminDemand, z.ZodType<any>>>;

export type DemandUpdate = z.infer<z.ZodObject<typeof zDemandUpdate>>;

const PUT = async (req: NextApiRequest) => {
  const demandUpdate = await validateObjectSchema(req.body, zDemandUpdate);

  // airtable types don't support null values but the API does
  await AirtableDB('FCU - Utilisateurs').update(req.query.demandId as string, demandUpdate as any, { typecast: true });
  await createUserEvent({
    type: demandUpdate['Gestionnaires validés'] ? 'demand_assigned' : 'demand_updated',
    context_type: 'demand',
    context_id: req.query.demandId as string,
    data: demandUpdate,
    author_id: req.user.id,
  });
};

const DELETE = async (req: NextApiRequest) => {
  await AirtableDB('FCU - Utilisateurs').destroy(req.query.demandId as string);
  await createUserEvent({
    type: 'demand_deleted',
    context_type: 'demand',
    context_id: req.query.demandId as string,
    author_id: req.user.id,
  });
};

export default handleRouteErrors(
  { DELETE, PUT },
  {
    requireAuthentication: ['admin'],
  }
);
