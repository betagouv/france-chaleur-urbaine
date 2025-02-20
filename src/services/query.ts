import { QueryClient } from '@tanstack/react-query';
import React from 'react';

/**
 * Use this hook to get the react query client instance.
 */
export function useQueryClient() {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1, // retry failing requests just once, see https://react-query.tanstack.com/guides/query-retries
            retryDelay: 3000, // retry failing requests after 3 seconds
            refetchOnWindowFocus: false, // see https://react-query.tanstack.com/guides/important-defaults
            refetchOnReconnect: false,
          },
        },
      })
  );

  return queryClient;
}
