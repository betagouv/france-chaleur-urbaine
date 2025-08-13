import { type NextApiRequest } from 'next';
import { z } from 'zod';

import { handleRouteErrors, validateObjectSchema } from '@/server/helpers/server';
import { listEvents } from '@/server/services/events';
import { eventTypes } from '@/shared/events';

const querySchema = {
  authorId: z.string().uuid().optional(),
  type: z.enum(eventTypes).optional(),
  contextType: z.string().optional(),
  contextId: z.string().optional(),
} as const;

const GET = async (req: NextApiRequest) => {
  const params = await validateObjectSchema(req.query, querySchema);
  return await listEvents({
    authorId: params.authorId,
    type: params.type,
    context: params.contextType && params.contextId ? { type: params.contextType, id: params.contextId } : undefined,
  });
};

export default handleRouteErrors(
  { GET },
  {
    requireAuthentication: ['admin'],
  }
);
