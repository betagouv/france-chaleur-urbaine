import { type NextApiRequest } from 'next';
import { z } from 'zod';

import { handleRouteErrors } from '@/server/helpers/server';
import { updateReseauEnConstruction } from '@/server/services/network';

const PATCH = async (req: NextApiRequest) => {
  const id = await z.coerce.number().parseAsync(req.query.id);
  await updateReseauEnConstruction(id, req.body.tags);
};

export default handleRouteErrors(
  { PATCH },
  {
    requireAuthentication: ['admin'],
  }
);
