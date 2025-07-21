import type { NextApiRequest } from 'next';

import { kdb } from '@/server/db/kysely';
import { handleRouteErrors, requirePutMethod, validateObjectSchema } from '@/server/helpers/server';
import { adminUserFormSchema } from '@/validation/user';

export default handleRouteErrors(
  async (req: NextApiRequest) => {
    requirePutMethod(req);

    const { optin_at, ...userUpdate } = await validateObjectSchema(req.body, adminUserFormSchema.partial().shape);

    await kdb
      .updateTable('users')
      .set({ ...userUpdate, optin_at: optin_at ? new Date() : null })
      .where('id', '=', req.query.userId as string)
      .execute();
  },
  {
    requireAuthentication: ['admin'],
  }
);
