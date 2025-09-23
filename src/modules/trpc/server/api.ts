import * as trpcNext from '@trpc/server/adapters/next';

import { createContext } from './context';
import { appRouter } from './routes';

export default trpcNext.createNextApiHandler({
  router: appRouter,
  /**
   * @link https://trpc.io/docs/context
   */
  createContext,
});
