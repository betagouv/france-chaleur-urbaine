import rateLimit, { ipKeyGenerator, MemoryStore } from 'express-rate-limit';

export const rateLimitError = new Error('too many requests'); // 429

// Store global partagé par toutes les routes
export const sharedStore = new MemoryStore();

export type RateLimiterOptions = { windowMs?: number; max?: number; path?: string };
/**
 * Crée un rate limiter basé sur express-rate-limit
 * Peut être utilisé pour Next.js API routes ou adapté pour tRPC
 */
export function createRateLimiter(options?: RateLimiterOptions) {
  return rateLimit({
    handler: (_req, _res, next) => {
      next(rateLimitError);
    },
    keyGenerator: options?.path
      ? (req) => {
          const ip = ipKeyGenerator(req.ip || '');
          return `${ip}:${options?.path}`;
        }
      : ipKeyGenerator,
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    max: options?.max || 20, // Limit each IP to 20 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    store: sharedStore,
    windowMs: options?.windowMs || 15 * 60 * 1000, // 15 minutes
    ...options,
  });
}
