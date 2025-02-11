import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // retry failing requests just once, see https://react-query.tanstack.com/guides/query-retries
      retryDelay: 3000, // retry failing requests after 3 seconds
      refetchOnWindowFocus: false, // see https://react-query.tanstack.com/guides/important-defaults
      refetchOnReconnect: false,
    },
  },
});
