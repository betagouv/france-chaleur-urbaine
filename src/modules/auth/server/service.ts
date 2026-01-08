import bcrypt, { genSalt, hash } from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { linkDemandsByEmail } from '@/modules/demands/server/demands-service';
import { sendEmailTemplate } from '@/modules/email';
import { createUserEvent } from '@/modules/events/server/service';
import { AirtableDB } from '@/server/db/airtable';
import { kdb } from '@/server/db/kysely';
import { logger } from '@/server/helpers/logger';
import { BadRequestError } from '@/server/helpers/server';
import { Airtable } from '@/types/enum/Airtable';
import type { UserRole } from '@/types/enum/UserRole';
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
      accepted_cgu_at: accept_cgu ? new Date() : null,
      activation_token: activationToken,
      email: lowerCaseEmail,
      gestionnaires: [],
      optin_at: optin_newsletter ? new Date() : null,
      password: await hash(password, await genSalt(10)),
      role,
      status: 'pending_email_confirmation',
      ...userData,
    })
    .returning(['id', 'email'])
    .executeTakeFirstOrThrow();

  logger.info('account register', { role, user_id: insertedUser.id });
  await sendEmailTemplate('auth.activation', insertedUser, { activationToken });

  await createUserEvent({
    author_id: insertedUser.id,
    context_id: insertedUser.id,
    context_type: 'user',
    type: 'user_created',
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
    author_id: user.id,
    context_id: user.id,
    context_type: 'user',
    type: 'user_login',
  });

  // Link demands by email on every login
  try {
    logger.info('attempting to link demands on login', { user_id: user.id });
    const linkedCount = await linkDemandsByEmail(user.id, user.email);
    logger.info('demands linked on login', {
      count: linkedCount,
      user_id: user.id,
    });
  } catch (error) {
    logger.error('failed to link demands on login', {
      error,
      user_id: user.id,
    });
    // Don't fail login if linking fails
  }

  return {
    active: !!user.active,
    email: user.email,
    gestionnaires: user.gestionnaires,
    id: user.id,
    role: user.role,
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
      activated_at: new Date(),
      activation_token: null,
      status: 'valid',
    })
    .where('id', '=', existingUser.id)
    .returning(['id', 'email'])
    .executeTakeFirstOrThrow();

  logger.info('account activate', { user_id: existingUser.id });
  await createUserEvent({
    author_id: existingUser.id,
    context_id: existingUser.id,
    context_type: 'user',
    type: 'user_activated',
  });
};

export const requestPassword = async (email: string) => {
  const lowerCaseEmail = email.trim().toLowerCase();
  const user = await kdb.selectFrom('users').selectAll().where('email', '=', lowerCaseEmail).where('active', 'is', true).executeTakeFirst();

  if (!user) {
    logger.warn('reset-password: missing user', { email: lowerCaseEmail });
    await AirtableDB(Airtable.CONNEXION).create([
      {
        fields: {
          Date: new Date().toISOString(),
          Email: lowerCaseEmail,
        },
      },
    ]);
    return;
  }

  const resetToken = generateRandomToken();
  const payload = {
    email: lowerCaseEmail,
    exp: Math.round(Date.now() / 1000) + 60 * 60 * 3, // 3 hour expiration
    resetToken,
  } as const;

  const token = jwt.sign(payload, process.env.NEXTAUTH_SECRET as string);
  await kdb.updateTable('users').set({ reset_token: resetToken }).where('id', '=', user.id).execute();
  await sendEmailTemplate('auth.reset-password', user, { token });
};

export const changePasswordWithResetToken = async (params: { password: string; token: { email: string; resetToken: string } }) => {
  const { password, token } = params;

  const user = await kdb.selectFrom('users').selectAll().where('email', '=', token.email).where('active', 'is', true).executeTakeFirst();

  if (!user) {
    throw new BadRequestError('Email incorrect');
  }

  if (!user.reset_token) {
    throw new BadRequestError('Ce lien a déjà été utilisé. Veuillez refaire une demande de réinitialisation de votre mot de passe.');
  }

  if (user.reset_token !== token.resetToken) {
    throw new BadRequestError('Lien invalide. Veuillez réinitialiser votre mot de passe.');
  }

  await kdb
    .updateTable('users')
    .set({
      password: await hash(password, await genSalt(10)),
      reset_token: null,
    })
    .where('id', '=', user.id)
    .execute();

  if (user.activation_token) {
    await activateUser(user.activation_token);
  }
};
