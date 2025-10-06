import { TRPCError } from '@trpc/server';

import type { TRoot } from '../context';

/**
 * Auth middleware that reads .auth metadata
 * Checks authentication, roles, and custom authorization functions
 */
export function createAuthMiddleware(t: TRoot) {
  return t.middleware(async ({ meta, ctx, next, input }) => {
    const authConfig = meta?.auth;

    if (!authConfig) return next(); // No auth config = allow

    // Check authentication
    if (authConfig.authenticated && !ctx.userId) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    }

    // Check roles using FCU's hasRole helper
    if (authConfig.roles?.length) {
      const hasAnyRole = authConfig.roles.some((role) => ctx.hasRole(role));
      if (!hasAnyRole) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Permissions invalides`,
        });
      }
    }

    // Check custom function
    if (authConfig.custom) {
      const customResult = await authConfig.custom(ctx, input);
      if (!customResult) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Custom authorization failed',
        });
      }
    }

    return next();
  });
}
