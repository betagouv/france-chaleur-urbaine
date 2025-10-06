import type { NextApiRequest } from 'next';
import { z } from 'zod';

import { eventTypes } from '@/modules/events/constants';
import { listEvents } from '@/modules/events/server/service';
import { handleRouteErrors, validateObjectSchema } from '@/server/helpers/server';

const querySchema = {
  authorId: z.uuid().optional(),
  contextId: z.string().optional(),
  contextType: z.string().optional(),
  type: z.enum(eventTypes).optional(),
} as const;

const GET = async (req: NextApiRequest) => {
  const params = await validateObjectSchema(req.query, querySchema);
  return await listEvents({
    authorId: params.authorId,
    context: params.contextType && params.contextId ? { id: params.contextId, type: params.contextType } : undefined,
    type: params.type,
  });
};

export default handleRouteErrors(
  { GET },
  {
    requireAuthentication: ['admin'],
  }
);
