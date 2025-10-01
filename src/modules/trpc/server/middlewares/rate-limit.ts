import { TRPCError } from '@trpc/server';

import { type TRoot } from '../context';

type RateLimitStore = Map<string, { count: number; resetTime: number }>;

const store: RateLimitStore = new Map();

/**
 * Rate limiting middleware pour tRPC - lit la config depuis les meta
 * Utilise une store en mémoire (adapté pour single instance, sinon utiliser Redis/Upstash)
 *
 * @example
 * route.meta({
 *   rateLimit: {
 *     windowMs: 60 * 1000,
 *     max: 1,
 *     message: 'Vous ne pouvez envoyer qu\'un message par minute'
 *   }
 * }).mutation(...)
 */
export function createRateLimitMiddleware(t: TRoot) {
  return t.middleware(async ({ ctx, path, meta, next }) => {
    const config = meta?.rateLimit;

    // Si pas de config, pas de rate limiting
    if (!config) return next();

    // Créer un identifiant unique combinant IP + route pour isoler les limites par endpoint
    const ip = getIdentifier(ctx);
    const identifier = `${ip}:${path}`;
    const now = Date.now();
    const record = store.get(identifier);

    // Nettoyer les anciennes entrées périodiquement
    if (Math.random() < 0.01) {
      cleanupExpiredRecords(now);
    }

    if (!record || now > record.resetTime) {
      // Nouvelle fenêtre
      store.set(identifier, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return next();
    }

    if (record.count >= config.max) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: config.message || `Trop de requêtes. Réessayez dans ${retryAfter} secondes.`,
      });
    }

    // Incrémenter le compteur
    record.count++;
    store.set(identifier, record);

    return next();
  });
}

function getIdentifier(ctx: any): string {
  // Utiliser l'IP du client comme identifiant
  const forwarded = ctx.req?.headers?.['x-forwarded-for'];
  const ip = typeof forwarded === 'string' ? forwarded.split(',')[0] : ctx.req?.socket?.remoteAddress || 'unknown';
  return ip;
}

function cleanupExpiredRecords(now: number) {
  for (const [key, record] of store.entries()) {
    if (now > record.resetTime) {
      store.delete(key);
    }
  }
}
