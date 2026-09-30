import type { NextApiHandler, NextApiRequest } from 'next';

import { businessRules } from '@/modules/app/business-rules';
import { createNextApiRateLimiter } from '@/modules/security/server/rate-limit/next-pages';
import { logger } from '@/server/helpers/logger';
import { getClientIp } from '@/server/helpers/request-ip';

export const LOGIN_RATE_LIMIT_MESSAGE = 'Trop de tentatives de connexion. Veuillez réessayer dans quelques minutes.';

const loginRateLimiter = createNextApiRateLimiter({
  limit: businessRules.loginAttemptsLimit.value,
  path: 'auth-login',
  windowMs: businessRules.loginAttemptsWindowMinutes.value * 60 * 1000,
});

/** NextAuth credentials sign-in requests are POSTs on `/api/auth/callback/credentials`. */
const isCredentialsSignInRequest = (req: NextApiRequest): boolean => {
  const segments = req.query.nextauth;
  return req.method === 'POST' && Array.isArray(segments) && segments[0] === 'callback' && segments[1] === 'credentials';
};

/**
 * Wraps the NextAuth handler to rate limit credentials sign-in attempts per client IP.
 * Successful and failed attempts both count: NextAuth answers both with a redirect, so they cannot be told apart here.
 * When the limit is hit, the response mimics NextAuth's shape (`{ url }`) so the client (`signIn` with redirect, the only usage) navigates to the login page with the error.
 */
export const withLoginRateLimit =
  (handler: NextApiHandler): NextApiHandler =>
  async (req, res) => {
    if (isCredentialsSignInRequest(req)) {
      try {
        await loginRateLimiter(req, res);
      } catch {
        logger.warn('login rate limited', { ip: getClientIp(req) });
        res.status(429).json({ url: `/connexion?notify=error:${encodeURIComponent(LOGIN_RATE_LIMIT_MESSAGE)}` });
        return;
      }
    }
    return handler(req, res);
  };
