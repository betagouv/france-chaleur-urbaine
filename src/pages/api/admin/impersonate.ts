import {
  handleRouteErrors,
  invalidPermissionsError,
  invalidRouteError,
  requireAuthentication,
  requireDeleteMethod,
  validateObjectSchema,
} from '@helpers/server';
import type { NextApiRequest, NextApiResponse } from 'next';
import { JWT, decode, encode } from 'next-auth/jwt';
import { z } from 'zod';
import { logger } from '@helpers/logger';

export default handleRouteErrors(
  async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method === 'DELETE') {
      requireDeleteMethod(req);
      const session = await requireAuthentication(req, res, true);
      if (!session.impersonating) {
        throw invalidPermissionsError;
      }

      // remove the impersonation
      const { impersonatedProfile, ...jwt } = await getSessionJWT(req);
      await generateSessionJWT(res, jwt);
      return;
    } else if (req.method === 'POST') {
      await requireAuthentication(req, res, ['admin']);

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
        impersonatedProfile,
      });
      return;
    }
    throw invalidRouteError;
  }
);

/**
 * Retrieve the Next Auth JWT.
 */
async function getSessionJWT(req: NextApiRequest): Promise<JWT> {
  const currentJWT = req.cookies['next-auth.session-token'];
  const decodedJWT = await decode({
    secret: process.env.NEXTAUTH_SECRET as string,
    token: currentJWT,
  });
  return decodedJWT as JWT;
}

/**
 * Generate a new Next Auth JWT and update the session cookie.
 */
async function generateSessionJWT(
  res: NextApiResponse,
  payload: JWT
): Promise<void> {
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
  res.setHeader(
    'Set-Cookie',
    `next-auth.session-token=${newJWT}; Path=/; Expires=${cookieExpirationDate.toUTCString()}; HttpOnly; SameSite=Lax`
  );
}
