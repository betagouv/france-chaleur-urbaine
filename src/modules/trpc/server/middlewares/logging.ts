import { type TRoot } from '../context';

/**
 * Middleware de logging pour tRPC qui reproduit le comportement de handleRouteErrors
 */
export function createLoggingMiddleware(t: TRoot) {
  return t.middleware(async ({ ctx, path, type, next }) => {
    const startTime = Date.now();
    // Attention le contexte est partagé parmi toutes les requêtes batchées. Ne pas réutiliser ctx.logger après
    const logger = ctx.logger.child({
      name: 'trpc',
      method: type,
      url: `trpc.${path}`,
    });

    const result = await next();
    const duration = Date.now() - startTime;

    if (result.ok) {
      logger.info('request completed', {
        duration,
      });
    } else {
      logger.error('request failed', {
        duration,
        code: result.error?.code,
        error: result.error?.message,
        stack: result.error?.stack,
      });
    }

    return result;
  });
}
