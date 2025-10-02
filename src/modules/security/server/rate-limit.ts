import rateLimit, { ipKeyGenerator, MemoryStore, type Options } from 'express-rate-limit';

export const rateLimitError = new Error('too many requests'); // 429

// Store global partagé par toutes les routes
export const sharedStore = new MemoryStore();

// Re-export ipKeyGenerator pour utilisation dans d'autres modules
export { ipKeyGenerator };

/**
 * Crée un rate limiter basé sur express-rate-limit
 * Peut être utilisé pour Next.js API routes ou adapté pour tRPC
 */
export function createRateLimiter(options?: Partial<Options>) {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (_req, _res, next) => {
      next(rateLimitError);
    },
    keyGenerator: ipKeyGenerator,
    ...options,
  });
}
