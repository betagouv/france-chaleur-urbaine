import { matchQuery, MutationCache, QueryClient } from '@tanstack/react-query';
import { httpBatchLink, loggerLink } from '@trpc/client';
import { createTRPCNext } from '@trpc/next';
import { type NextPageContext } from 'next';

import { type AppRouter, type AppRouterKeys } from '../types';

/**
 * Create a custom QueryClient with automatic cache invalidation for mutations
 */
const createQueryClient = () => {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        staleTime: 5 * 60 * 1000, // 5 minutes
      },
    },
    mutationCache: new MutationCache({
      onSuccess: async (_data, _variables, _context, mutation) => {
        void client.invalidateQueries({
          predicate: (query) =>
            // invalidate all matching tags at once
            // or everything if no meta is provided
            mutation.meta?.invalidates?.some((queryKey: AppRouterKeys) => matchQuery({ queryKey }, query)) ?? true,
        });

        // const meta = mutation.meta as { invalidates?: AppRouterKeys[] };
        // console.log('');//eslint-disable-line
        // console.log('╔════START══meta.invalidates══════════════════════════════════════════════════');//eslint-disable-line
        // console.log(meta.invalidates);//eslint-disable-line
        // console.log('╚════END════meta.invalidates══════════════════════════════════════════════════');//eslint-disable-line
        // debugger;
        // if (meta?.invalidates) {
        //   for (const queryKey of meta.invalidates) {
        //     // Convert tRPC path to React Query key format
        //     // const parts = (queryKey as string).split('.');
        //     console.log('queryKey', queryKey);
        //     const lo = await client.invalidateQueries({
        //       queryKey: queryKey.split('.'),
        //     });
        //     console.log('lo', lo);
        //   }
        // }
      },
    }),
  });
  return client;
};

declare module '@tanstack/react-query' {
  interface Register {
    mutationMeta: {
      invalidates?: Array<AppRouterKeys>;
    };
  }
}
/**
 * Extend `NextPageContext` with meta data that can be picked up by `responseMeta()` when server-side rendering
 */
export interface SSRContext extends NextPageContext {
  /**
   * Set HTTP Status code
   * @example
   * const trpcContext = trpc.useContext();
   * if (trpcContext.ssrContext) {
   *   trpcContext.ssrContext.status = 404;
   * }
   */
  status?: number;
}

/**
 * A set of strongly-typed React hooks from your `AppRouter` type signature with `createTRPCNext`.
 * @link https://trpc.io/docs/react#3-create-trpc-hooks
 */
const trpc = createTRPCNext<AppRouter>({
  config({ ctx }) {
    // adds pretty logs to your console in development and logs errors in production
    const trpcLoggerLink = loggerLink({
      enabled: (opts) => process.env.NODE_ENV === 'development' || (opts.direction === 'down' && opts.result instanceof Error),
    });

    const trpcHttpBatchLink = httpBatchLink({
      url: `${typeof window !== 'undefined' ? '' : process.env.SITE_URL || 'http://localhost:3000'}/api/trpc`,
      /**
       * Set custom request headers on every request from tRPC
       * @link https://trpc.io/docs/ssr
       */
      headers() {
        if (!ctx?.req?.headers) {
          return {};
        }
        // To use SSR properly, you need to forward the client's headers to the server
        // This is so you can pass through things like cookies when we're server-side rendering

        return {
          ...ctx.req.headers,
          // Optional: inform server that it's an SSR request
          'x-ssr': '1',
        };
      },
    });

    return {
      /**
       * @link https://trpc.io/docs/client/links
       */
      links: [trpcLoggerLink, trpcHttpBatchLink],
      /**
       * @link https://tanstack.com/query/v5/docs/react/reference/QueryClient
       */
      queryClient: createQueryClient(),
    };
  },
  /**
   * @link https://trpc.io/docs/ssr
   */
  ssr: false,
});

export default trpc;
