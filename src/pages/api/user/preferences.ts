import { type NextApiRequest } from 'next';
import { z } from 'zod';

import { kdb } from '@/server/db/kysely';
import { handleRouteErrors, invalidRouteError } from '@/server/helpers/server';

async function GET(req: NextApiRequest) {
  const userPreferences = await kdb
    .selectFrom('users')
    .select(['email', 'signature'])
    .where('id', '=', req.user.id)
    .executeTakeFirstOrThrow();
  return userPreferences;
}

export type UserPreferences = Awaited<ReturnType<typeof GET>>;

const zUserPreferences = z.object({
  // email is not editable
  signature: z.string().nullable(),
});

export type UserPreferencesInput = z.infer<typeof zUserPreferences>;

async function PATCH(req: NextApiRequest) {
  const preferences = await zUserPreferences.parseAsync(req.body);

  await kdb.updateTable('users').set({ signature: preferences.signature }).where('id', '=', req.user.id).execute();
}

export default handleRouteErrors(
  async (req: NextApiRequest) => {
    if (req.method === 'GET') {
      return GET(req);
    } else if (req.method === 'PATCH') {
      return PATCH(req);
    }

    return invalidRouteError;
  },
  {
    requireAuthentication: true,
  }
);
