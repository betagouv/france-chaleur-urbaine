import * as trpcNext from '@trpc/server/adapters/next';

import { appRouter, createContext } from '../trpc.config';

export default trpcNext.createNextApiHandler({
  router: appRouter,
  /**
   * @link https://trpc.io/docs/context
   */
  createContext,
});
