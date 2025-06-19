import type { NextApiRequest } from 'next';
import { z } from 'zod';

import { kdb } from '@/server/db/kysely';
import { handleRouteErrors, requirePutMethod, validateObjectSchema } from '@/server/helpers/server';

const zUserUpdate = {
  gestionnaires: z.array(z.string()).optional(),
};

export type UserUpdate = z.infer<z.ZodObject<typeof zUserUpdate>>;

export default handleRouteErrors(
  async (req: NextApiRequest) => {
    requirePutMethod(req);

    const userUpdate = await validateObjectSchema(req.body, zUserUpdate);

    await kdb
      .updateTable('users')
      .set(userUpdate)
      .where('id', '=', req.query.userId as string)
      .execute();
  },
  {
    requireAuthentication: ['admin'],
  }
);
