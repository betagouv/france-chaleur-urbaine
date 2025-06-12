import type { NextApiRequest } from 'next';
import { z } from 'zod';

import { zUpdateUserSchema } from '@/pages/admin/users';
import { kdb } from '@/server/db/kysely';
import { handleRouteErrors } from '@/server/helpers/server';

const POST = async (req: NextApiRequest) => {
  const id = await z.string().parseAsync(req.query.id);
  const userData = await zUpdateUserSchema.parseAsync(req.body);

  await kdb.updateTable('users').set(userData).where('id', '=', id).execute();
};

export default handleRouteErrors(
  { POST },
  {
    requireAuthentication: ['admin'],
  }
);
