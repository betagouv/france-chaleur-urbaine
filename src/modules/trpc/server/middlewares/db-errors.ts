import { TRPCError } from '@trpc/server';

import { isUniqueViolation, UNIQUE_VIOLATION_MESSAGE } from '@/server/helpers/db-errors';

import type { TRoot } from '../context';

/**
 * Traduit globalement les violations d'unicité en `TRPCError` lisible (409), pour toutes les procédures.
 * À placer en dernier (`innermost`) pour remapper l'erreur du résolveur avant le logging.
 */
export function createDbErrorMiddleware(t: TRoot) {
  return t.middleware(async ({ next }) => {
    const result = await next();
    if (!result.ok && isUniqueViolation(result.error.cause)) {
      throw new TRPCError({ cause: result.error, code: 'CONFLICT', message: UNIQUE_VIOLATION_MESSAGE });
    }
    return result;
  });
}
