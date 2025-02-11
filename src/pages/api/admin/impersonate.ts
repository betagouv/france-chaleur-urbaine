import type { NextApiRequest, NextApiResponse } from 'next';
import { type JWT, decode, encode } from 'next-auth/jwt';
import { z } from 'zod';

import { logger } from '@/server/helpers/logger';
import {
  handleRouteErrors,
  invalidPermissionsError,
  invalidRouteError,
  requireAuthentication,
  validateObjectSchema,
} from '@/server/helpers/server';

const DELETE = async (req: NextApiRequest, res: NextApiResponse) => {
  requireAuthentication(req.user, true);
  if (!req.session.impersonating) {
    throw invalidPermissionsError;
  }

  // remove the impersonation
  const { impersonatedProfile, ...jwt } = await getSessionJWT(req);
  await generateSessionJWT(res, jwt);
  return;
};

const POST = async (req: NextApiRequest, res: NextApiResponse) => {
  requireAuthentication(req.user, ['admin']);

  const impersonatedProfile = await validateObjectSchema(req.body, {
    role: z.literal('gestionnaire'),
    gestionnaires: z.array(z.string()),
  });

  logger.info('impersonating', {
    ...impersonatedProfile,
  });

  const jwt = await getSessionJWT(req);
  await generateSessionJWT(res, {
    ...jwt,
    impersonatedProfile: {
      roles: [impersonatedProfile.role],
      gestionnaires: impersonatedProfile.gestionnaires,
    },
  });
  return;
};

export default handleRouteErrors(async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'DELETE') {
    return DELETE(req, res);
  } else if (req.method === 'POST') {
    return POST(req, res);
  }
  throw invalidRouteError;
});

/**
 * Retrieve the Next Auth JWT.
 */
async function getSessionJWT(req: NextApiRequest): Promise<JWT> {
  const isSecureCookie = (process.env.NEXTAUTH_URL ?? '').startsWith('https');
  const currentJWT = req.cookies[getCookieName(isSecureCookie)];
  const decodedJWT = await decode({
    secret: process.env.NEXTAUTH_SECRET as string,
    token: currentJWT,
  });
  return decodedJWT as JWT;
}

/**
 * Generate a new Next Auth JWT and update the session cookie.
 */
async function generateSessionJWT(res: NextApiResponse, payload: JWT): Promise<void> {
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
  res.setHeader(
    'Set-Cookie',
    `${getCookieName(isSecureCookie)}=${newJWT}; Path=/; Expires=${cookieExpirationDate.toUTCString()}; HttpOnly; ${
      isSecureCookie ? 'Secure; ' : ''
    }SameSite=Lax`
  );
}

function getCookieName(isSecureCookie: boolean): string {
  return `${isSecureCookie ? '__Secure-' : ''}next-auth.session-token`;
}
