import { type NextApiRequest } from 'next';
import { z } from 'zod';

import { updateReseauEnConstruction } from '@/modules/reseaux/server/service';
import { handleRouteErrors } from '@/server/helpers/server';

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
