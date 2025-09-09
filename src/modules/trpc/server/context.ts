import { type CreateNextContextOptions } from '@trpc/server/adapters/next';

import buildContext from '@/modules/config/server/context-builder';

/**
 * Creates context for an incoming request using FCU's existing context builder
 * @link https://trpc.io/docs/context
 */
export async function createContext(opts: CreateNextContextOptions) {
  const { req, res } = opts;

  // Use FCU's context builder which handles session management
  const baseContext = await buildContext(req, res);

  return {
    ...baseContext,
    req,
    res,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
