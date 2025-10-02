import { initTRPC } from '@trpc/server';

import { type RateLimiterOptions } from '@/modules/security/server/rate-limit';
import { type createContext } from '@/modules/trpc/trpc.config';

export type Context = Awaited<ReturnType<typeof createContext>>;
export { createContext };

export type AuthConfig = {
  authenticated?: boolean;
  roles?: Context['user']['role'][];
  custom?: (ctx: Context, input?: any) => boolean | Promise<boolean>;
};

export interface Meta {
  auth?: AuthConfig;
  rateLimit?: Omit<RateLimiterOptions, 'path'> & { message?: string };
}
// Initialize tRPC with context
export const t = initTRPC.context<Context>().meta<Meta>().create();

export type TRoot = typeof t;
