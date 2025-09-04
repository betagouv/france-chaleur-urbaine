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
  /**
   * Enable query batching
   */
  batching: {
    enabled: true,
  },
  /**
   * @link https://trpc.io/docs/caching#api-response-caching
   */
  // responseMeta() {
  //   // cache request for 1 day + revalidate once every second
  //   const ONE_DAY_IN_SECONDS = 60 * 60 * 24;
  //   return {
  //     headers: {
  //       'cache-control': `s-maxage=1, stale-while-revalidate=${ONE_DAY_IN_SECONDS}`,
  //     },
  //   };
  // },
});
