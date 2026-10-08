import { ipKeyGenerator, MemoryStore, type Options, rateLimit } from 'express-rate-limit';

import { getClientIp } from '@/server/helpers/request-ip';

export const rateLimitError = new Error('Trop de requêtes, veuillez réessayer plus tard.'); // 429, message shown to the user

// Store global partagé par toutes les routes
export const sharedStore = new MemoryStore();

export type RateLimiterOptions = Partial<Pick<Options, 'windowMs' | 'limit'>> & { path: string };

/**
 * Crée un rate limiter basé sur express-rate-limit
 * Peut être utilisé pour Next.js API routes ou adapté pour tRPC
 */
export function createRateLimiter({ path, ...options }: RateLimiterOptions) {
  return rateLimit({
    handler: (_req, _res, next) => {
      next(rateLimitError);
    },
    keyGenerator: path
      ? (req) => {
          const ip = ipKeyGenerator(getClientIp(req) ?? '');
          return `${ip}:${path}`;
        }
      : ipKeyGenerator,
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    limit: options?.limit || 20, // Limit each IP to 20 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    store: sharedStore,
    validate: { unsharedStore: false },
    windowMs: options?.windowMs || 15 * 60 * 1000, // 15 minutes
    ...options,
  });
}
