import * as trpcNext from '@trpc/server/adapters/next';

import { appRouter, createContext } from '../trpc.config';

export default trpcNext.createNextApiHandler({
  /**
   * @link https://trpc.io/docs/context
   */
  createContext,
  router: appRouter,
});
