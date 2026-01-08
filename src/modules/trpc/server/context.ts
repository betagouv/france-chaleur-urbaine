import { initTRPC } from '@trpc/server';
import z, { ZodError } from 'zod';

import type { RateLimiterOptions } from '@/modules/security/server/rate-limit';
import type { createContext } from '@/modules/trpc/trpc.config';

export type Context = Awaited<ReturnType<typeof createContext>>;
export type { createContext };

export type AuthConfig = {
  authenticated?: boolean;
  roles?: Context['user']['role'][];
  custom?: (ctx: Context, input?: any) => boolean | Promise<boolean>;
};

export interface Meta {
  auth?: AuthConfig;
  rateLimit?: false | (Omit<RateLimiterOptions, 'path'> & { message?: string });
}
// Initialize tRPC with context
export const t = initTRPC
  .context<Context>()
  .meta<Meta>()
  .create({
    errorFormatter(opts) {
      const { shape, error } = opts;
      return {
        ...shape,
        data: {
          ...shape.data,
          ...(error.code === 'BAD_REQUEST' && error.cause instanceof ZodError
            ? { err: error.cause, zodError: z.treeifyError(error.cause) }
            : {}),
        },
      };
    },
  });

export type TRoot = typeof t;
