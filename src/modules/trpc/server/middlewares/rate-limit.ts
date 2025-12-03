import { TRPCError } from '@trpc/server';

import { createRateLimiter, type RateLimiterOptions, rateLimitError } from '@/modules/security/server/rate-limit';

import type { TRoot } from '../context';

export type { RateLimiterOptions };
/**
 * Rate limiting middleware pour tRPC - lit la config depuis les meta
 * Utilise express-rate-limit avec un store partagé et préfixes par route
 *
 * @example
 * route.meta({
 *   rateLimit: {
 *     windowMs: 60 * 1000,
 *     limit: 1,
 *     message: 'Vous ne pouvez envoyer qu\'un message par minute'
 *   }
 * }).mutation(...)
 */
export function createRateLimitMiddleware(t: TRoot) {
  return t.middleware(async ({ meta, ctx, path, next }) => {
    const config = meta?.rateLimit;

    // Si pas de config, pas de rate limiting
    if (!config) return next();

    // Créer un rate limiter avec store partagé et préfixe par route
    const rateLimiter = createRateLimiter({
      limit: config.limit,
      path,
      windowMs: config.windowMs,
    });

    await new Promise<void>((resolve, reject) => {
      rateLimiter(ctx.req as any, ctx.res as any, (error?: Error) => {
        if (error === rateLimitError) {
          reject(
            new TRPCError({
              code: 'TOO_MANY_REQUESTS',
              message: config.message || 'Trop de requêtes. Veuillez réessayer plus tard.',
            })
          );
        } else if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });

    return next();
  });
}
