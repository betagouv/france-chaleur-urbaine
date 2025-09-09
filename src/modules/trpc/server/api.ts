import * as trpcNext from '@trpc/server/adapters/next';

import { createContext } from './context';
import { appRouter } from './routes';

export default trpcNext.createNextApiHandler({
  router: appRouter,
  /**
   * @link https://trpc.io/docs/context
   */
  createContext,
  /**
   * @link https://trpc.io/docs/error-handling
   */
  onError({ error, type, path }) {
    console.error('tRPC Error:', {
      type,
      path,
      error: error.message,
      code: error.code,
    });

    if (error.code === 'INTERNAL_SERVER_ERROR') {
      // Send to Sentry or other error tracking service
      console.error('Internal server error:', error);
    }
  },
  batching: {
    enabled: true,
  },
});
