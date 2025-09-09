import { TRPCError } from '@trpc/server';

import { type Context } from '../context';

// Define auth metadata types
export type AuthConfig = {
  authenticated?: boolean;
  roles?: Context['user']['role'][];
  custom?: (ctx: Context, input?: any) => boolean | Promise<boolean>;
};

// Extend tRPC's meta to include our auth config
declare module '@trpc/server' {
  interface Meta {
    auth?: AuthConfig;
  }
}

/**
 * Auth middleware that reads .auth() metadata
 * Checks authentication, roles, and custom authorization functions
 */
export function createAuthMiddleware(t: any) {
  return t.middleware(async ({ meta, ctx, next, input }: { meta: any; ctx: Context; next: () => Promise<any>; input: any }) => {
    const authConfig = meta?.auth as AuthConfig | undefined;

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
