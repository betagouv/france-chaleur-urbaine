import * as Sentry from '@sentry/nextjs';

import type { TRoot } from '../context';

/**
 * Middleware de logging pour tRPC qui reproduit le comportement de handleRouteErrors
 */
export function createLoggingMiddleware(t: TRoot) {
  return t.middleware(async ({ ctx, path, type, next }) => {
    const startTime = Date.now();
    // Attention le contexte est partagé parmi toutes les requêtes batchées. Ne pas réutiliser ctx.logger après
    const logger = ctx.logger.child({
      method: type,
      name: 'trpc',
      url: `trpc.${path}`,
    });

    const result = await next();
    const duration = Date.now() - startTime;

    if (result.ok) {
      logger.info('request completed', {
        duration,
      });
    } else {
      Sentry.captureException(result.error);
      logger.error('request failed', {
        code: result.error?.code,
        duration,
        error: result.error?.message,
        stack: result.error?.stack,
      });
    }

    return result;
  });
}
