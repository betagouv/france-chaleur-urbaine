import bcrypt, { genSalt, hash } from 'bcryptjs';

import { kdb } from '@/server/db/kysely';
import { logger } from '@/server/helpers/logger';
import { BadRequestError } from '@/server/helpers/server';
import { type UserRole } from '@/types/enum/UserRole';
import { generateRandomToken } from '@/utils/random';

import { sendEmail } from '../email/react-email';

export const register = async ({
  email,
  password,
  role,
  accept_cgu,
  optin_newsletter,
  ...userData
}: {
  email: string;
  password: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  structure?: string;
  structure_type?: string;
  structure_other?: string;
  phone?: string | null;
  accept_cgu?: boolean;
  optin_newsletter?: boolean;
}) => {
  const existingUser = await kdb.selectFrom('users').select('id').where('email', '=', email).executeTakeFirst();
  if (existingUser) {
    throw new BadRequestError(`L'utilisateur associé à l'email '${email}' existe déjà.`);
  }

  const activationToken = generateRandomToken();
  const insertedUser = await kdb
    .insertInto('users')
    .values({
      email,
      password: await hash(password, await genSalt(10)),
      role,
      status: 'pending_email_confirmation',
      activation_token: activationToken,
      gestionnaires: [],
      accepted_cgu_at: accept_cgu ? new Date() : null,
      optin_at: optin_newsletter ? new Date() : null,
      ...userData,
    })
    .returning(['id', 'email'])
    .executeTakeFirstOrThrow();

  logger.info('account register', { user_id: insertedUser.id, role });
  sendEmail(insertedUser, 'inscription', {
    activationToken: activationToken,
  });
  return insertedUser.id;
};

export const login = async (email: string, password: string) => {
  const user = await kdb
    .selectFrom('users')
    .selectAll()
    .where('email', '=', email.trim().toLowerCase())
    .where('active', 'is', true)
    .executeTakeFirst();

  if (!user) {
    throw new Error('Mauvais login/mot de passe');
  }

  if (user.status === 'pending_email_confirmation') {
    throw new Error('Vous devez confirmer votre email avant de vous connecter');
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    throw new Error('Mauvais login/mot de passe');
  }

  logger.info('account login', { user_id: user.id });
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    active: !!user.active,
    gestionnaires: user.gestionnaires,
    signature: user.signature,
  };
};

export const activateUser = async (activationToken: string) => {
  const existingUser = await kdb.selectFrom('users').select('id').where('activation_token', '=', activationToken).executeTakeFirst();
  if (!existingUser) {
    throw new BadRequestError('Jeton invalide');
  }

  await kdb
    .updateTable('users')
    .set({
      activation_token: null,
      activated_at: new Date(),
      status: 'valid',
    })
    .where('id', '=', existingUser.id)
    .returning(['id', 'email'])
    .executeTakeFirstOrThrow();

  logger.info('account activate', { user_id: existingUser.id });
};
