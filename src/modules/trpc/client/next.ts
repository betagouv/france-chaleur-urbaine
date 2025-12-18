import { httpBatchLink, loggerLink, type TRPCLink } from '@trpc/client';
import { createTRPCNext } from '@trpc/next';
import { observable } from '@trpc/server/observable';
import type { NextPageContext } from 'next';
import { clientConfig } from '@/client-config';
import { handleClientError } from '@/modules/notification';
import type { AppRouter } from '../types';

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
 * Custom trpc client link to handle errors and show toast notifications in the client.
 */
const errorHandlerLink: TRPCLink<AppRouter> = () => {
  return ({ next, op }) => {
    return observable((observer) => {
      const unsubscribe = next(op).subscribe({
        complete() {
          observer.complete();
        },
        error(err) {
          handleClientError(err);
          observer.error(err);
        },
        next(value) {
          observer.next(value);
        },
      });
      return unsubscribe;
    });
  };
};

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
      url: `${typeof window !== 'undefined' ? '' : clientConfig.websiteUrl}/api/trpc`,
    });

    return {
      /**
       * @link https://trpc.io/docs/client/links
       */
      links: [errorHandlerLink, trpcLoggerLink, trpcHttpBatchLink],
      /**
       * @link https://tanstack.com/query/v5/docs/react/reference/QueryClient
       */
      queryClientConfig: {
        defaultOptions: {
          queries: {
            retry: 1,
            // Use isPending instead of isLoading for v5 compatibility
            staleTime: 5 * 60 * 1000, // 5 minutes
          },
        },
      },
    };
  },
  /**
   * @link https://trpc.io/docs/ssr
   */
  ssr: false,
});

export default trpc;
