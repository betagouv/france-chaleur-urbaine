import type { NextApiRequest } from 'next';

import { zCreateUserRequest } from '@/components/Admin/AccountCreationForm';
import { kdb, sql } from '@/server/db/kysely';
import { sendEmail } from '@/server/email/react-email';
import { BadRequestError, handleRouteErrors } from '@/server/helpers/server';
import { generateRandomToken } from '@/utils/random';

const GET = async () => {
  const users = await kdb
    .selectFrom('users')
    .select([
      'id',
      'email',
      'role',
      'active',
      'created_at',
      'last_connection',
      'gestionnaires',
      sql<boolean>`from_api IS NOT NULL`.as('from_api'),
    ])
    .orderBy('id')
    .execute();
  return users;
};

export type AdminManageUserItem = Awaited<ReturnType<typeof GET>>[number];

const POST = async (req: NextApiRequest) => {
  const { email, role } = await zCreateUserRequest.parseAsync(req.body);

  const existingUser = await kdb.selectFrom('users').select('id').where('email', '=', email).executeTakeFirst();
  if (existingUser) {
    throw new BadRequestError(`L'utilisateur associé à l'email '${email}' existe déjà.`);
  }

  const insertedUser = await kdb
    .insertInto('users')
    .values({
      email,
      role,
      status: 'pending_email_confirmation',
      password: '<awaiting_user_definition>',
      gestionnaires: [],
    })
    .returning(['id', 'email'])
    .executeTakeFirstOrThrow();

  await sendEmail(insertedUser, 'invitation', {
    activationToken: generateRandomToken(),
  });

  return { id: insertedUser.id };
};

export default handleRouteErrors(
  { GET, POST },
  {
    requireAuthentication: ['admin'],
  }
);
