import bcrypt, { genSalt, hash } from 'bcryptjs';

import { createUserEvent } from '@/modules/events/server/service';
import { kdb } from '@/server/db/kysely';
import { sendEmailTemplate } from '@/server/email';
import { logger } from '@/server/helpers/logger';
import { BadRequestError } from '@/server/helpers/server';
import { type UserRole } from '@/types/enum/UserRole';
import { generateRandomToken } from '@/utils/random';

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
  const lowerCaseEmail = email.trim().toLowerCase();
  const existingUser = await kdb.selectFrom('users').select('id').where('email', 'ilike', lowerCaseEmail).executeTakeFirst();
  if (existingUser) {
    throw new BadRequestError(`L'utilisateur associé à l'email '${email}' existe déjà. Connectez-vous.`);
  }

  const activationToken = generateRandomToken();
  const insertedUser = await kdb
    .insertInto('users')
    .values({
      email: lowerCaseEmail,
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
  await sendEmailTemplate('activation', insertedUser, { activationToken });

  await createUserEvent({
    type: 'user_created',
    context_type: 'user',
    context_id: insertedUser.id,
    author_id: insertedUser.id,
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
  await createUserEvent({
    type: 'user_login',
    context_type: 'user',
    context_id: user.id,
    author_id: user.id,
  });
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
  await createUserEvent({
    type: 'user_activated',
    context_type: 'user',
    context_id: existingUser.id,
    author_id: existingUser.id,
  });
};
