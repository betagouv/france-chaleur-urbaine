import { type CreateNextContextOptions } from '@trpc/server/adapters/next';

import buildContext from '@/modules/config/server/context-builder';

/**
 * Creates context for an incoming request using FCU's existing context builder
 * @link https://trpc.io/docs/context
 */
export function createContext(opts: CreateNextContextOptions) {
  const { req, res } = opts;

  // Use FCU's existing context builder
  const baseContext = buildContext(req);

  return {
    ...baseContext,
    req,
    res,
  };
}

export type Context = ReturnType<typeof createContext>;
