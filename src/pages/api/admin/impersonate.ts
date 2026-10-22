import type { NextApiRequest, NextApiResponse } from 'next';
import { decode, encode, type JWT } from 'next-auth/jwt';
import { z } from 'zod';

import { createUserEvent } from '@/modules/events/server/service';
import { zPermissionInput } from '@/modules/permissions/types';
import { serverConfig } from '@/server/config';
import { kdb } from '@/server/db/kysely';
import { logger } from '@/server/helpers/logger';
import {
  BadRequestError,
  handleRouteErrors,
  invalidPermissionsError,
  requireAuthentication,
  validateObjectSchema,
} from '@/server/helpers/server';
import type { UserRole } from '@/types/enum/UserRole';
import type { NonEmptyArray } from '@/utils/typescript';

const DELETE = async (req: NextApiRequest, res: NextApiResponse) => {
  requireAuthentication(req.user, true);
  if (!req.session.impersonating) {
    throw invalidPermissionsError;
  }

  // remove the impersonation
  const { impersonatedProfile: _, ...jwt } = await getSessionJWT(req);
  await generateSessionJWT(req, res, jwt);
  // req.user keeps the admin id, its role is the impersonated one
  await createUserEvent({
    author_id: req.user.id,
    context_id: req.user.id,
    context_type: 'user',
    data: { role: req.user.role },
    type: 'user_impersonation_stopped',
  });
  return;
};

const POST = async (req: NextApiRequest, res: NextApiResponse) => {
  requireAuthentication(req.user, ['admin']);

  // full-profile mode (dev only): the whole session is built from the target account
  if (req.body?.userId) {
    if (!serverConfig.allowFullImpersonation) {
      throw invalidPermissionsError;
    }
    const { userId } = await validateObjectSchema(req.body, { userId: z.string().uuid() });
    const target = await kdb
      .selectFrom('users')
      .select(['id', 'role'])
      .where('id', '=', userId)
      .executeTakeFirstOrThrow(() => new BadRequestError('Utilisateur introuvable'));
    logger.warn('impersonating full profile', { admin_id: req.user.id, target_user_id: target.id });
    const jwt = await getSessionJWT(req);
    await generateSessionJWT(req, res, { ...jwt, impersonatedProfile: { role: target.role, userId: target.id } });
    return;
  }

  const impersonatedProfile = await validateObjectSchema(req.body, {
    anonymize: z.boolean().optional(),
    permissions: zPermissionInput.optional(),
    role: z.enum(['gestionnaire', 'collectivite', 'alec', 'ccrt', 'professionnel', 'particulier'] as NonEmptyArray<UserRole>),
  });

  await createUserEvent({
    author_id: req.user.id,
    context_id: req.user.id,
    context_type: 'user',
    data: {
      anonymize: impersonatedProfile.anonymize ?? false,
      permissions_count: impersonatedProfile.permissions?.length ?? 0,
      role: impersonatedProfile.role,
    },
    type: 'user_impersonation_started',
  });

  const jwt = await getSessionJWT(req);
  await generateSessionJWT(req, res, {
    ...jwt,
    impersonatedProfile: {
      role: impersonatedProfile.role,
      ...(impersonatedProfile.permissions?.length ? { permissions: impersonatedProfile.permissions } : {}),
      ...(impersonatedProfile.anonymize ? { anonymize: true } : {}),
    },
  });
  return;
};

export default handleRouteErrors({ DELETE, POST });

// Browsers cap each cookie at ~4 KB; mirror NextAuth's SessionStore chunking so large
// impersonation JWTs (users with many permissions) are split across cookies instead of
// being silently dropped by the browser, which would leave the previous session in place.
const ALLOWED_COOKIE_SIZE = 4096;
const ESTIMATED_EMPTY_COOKIE_SIZE = 163;
const CHUNK_SIZE = ALLOWED_COOKIE_SIZE - ESTIMATED_EMPTY_COOKIE_SIZE;

/**
 * Retrieve the Next Auth JWT, reassembling chunked session cookies the way NextAuth does.
 */
async function getSessionJWT(req: NextApiRequest): Promise<JWT> {
  const isSecureCookie = (process.env.NEXTAUTH_URL ?? '').startsWith('https');
  const cookieName = getCookieName(isSecureCookie);
  const currentJWT = Object.keys(req.cookies)
    .filter((name) => name.startsWith(cookieName))
    .sort((a, b) => getCookieChunkIndex(a) - getCookieChunkIndex(b))
    .map((name) => req.cookies[name])
    .join('');
  const decodedJWT = await decode({
    secret: process.env.NEXTAUTH_SECRET as string,
    token: currentJWT,
  });
  return decodedJWT as JWT;
}

/**
 * Generate a new Next Auth JWT and update the session cookie, chunking it across
 * several cookies when it exceeds the browser size limit (mirrors NextAuth).
 */
async function generateSessionJWT(req: NextApiRequest, res: NextApiResponse, payload: JWT): Promise<void> {
  const newJWT = await encode({
    secret: process.env.NEXTAUTH_SECRET as string,
    token: payload,
  });
  // decode to retrieve the expiration date of the JWT
  const decodedNewJWT = await decode({
    secret: process.env.NEXTAUTH_SECRET as string,
    token: newJWT,
  });
  const cookieExpirationDate = new Date((decodedNewJWT as any).exp * 1000);
  const isSecureCookie = (process.env.NEXTAUTH_URL ?? '').startsWith('https');
  const cookieName = getCookieName(isSecureCookie);
  const attributes = `Path=/; HttpOnly; ${isSecureCookie ? 'Secure; ' : ''}SameSite=Lax`;

  const chunks =
    newJWT.length <= CHUNK_SIZE
      ? [{ name: cookieName, value: newJWT }]
      : Array.from({ length: Math.ceil(newJWT.length / CHUNK_SIZE) }, (_, i) => ({
          name: `${cookieName}.${i}`,
          value: newJWT.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE),
        }));

  const writtenNames = new Set(chunks.map((chunk) => chunk.name));
  const setCookies = chunks.map((chunk) => `${chunk.name}=${chunk.value}; Expires=${cookieExpirationDate.toUTCString()}; ${attributes}`);

  // Expire any previously set session cookie (base or chunk) we are not reusing,
  // otherwise stale chunks would corrupt the reassembled JWT on the next read.
  for (const name of Object.keys(req.cookies)) {
    if (name.startsWith(cookieName) && !writtenNames.has(name)) {
      setCookies.push(`${name}=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; ${attributes}`);
    }
  }

  res.setHeader('Set-Cookie', setCookies);
}

function getCookieName(isSecureCookie: boolean): string {
  return `${isSecureCookie ? '__Secure-' : ''}next-auth.session-token`;
}

/**
 * Numeric suffix of a chunked session cookie (`…session-token.0` → 0); the unchunked base cookie → 0.
 */
function getCookieChunkIndex(cookieName: string): number {
  const index = Number(cookieName.split('.').pop());
  return Number.isNaN(index) ? 0 : index;
}
