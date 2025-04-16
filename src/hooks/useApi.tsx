import {
  type InvalidateQueryFilters,
  type MutationKey,
  type QueryKey,
  useMutation,
  type UseMutationOptions,
  type UseMutationResult,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';

import { deleteFetchJSON, fetchJSON, postFetchJSON, putFetchJSON } from '@/utils/network';
import { type OmitFirst, type Partialize } from '@/utils/typescript';

type UseQueryParams = Parameters<typeof useQuery>;

export const useFetch = <TQueryFnData, TError = Error, TData = TQueryFnData, TQueryKey extends QueryKey = QueryKey>(
  url: string,
  { queryKey, queryFn, ...options }: Partialize<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, 'queryKey' | 'queryFn'> = {},
  queryClient?: UseQueryParams[1]
): UseQueryResult<TData, TError> => {
  return useQuery<TQueryFnData, TError, TData, TQueryKey>(
    {
      queryKey: queryKey || ([url] as unknown as TQueryKey),
      queryFn: queryFn ?? (() => fetchJSON<TQueryFnData>(url)),
      ...options,
    },
    queryClient
  );
};

const useAction = <TVariables, TOutput = unknown, TError = Error, TContext = unknown>(
  method: 'POST' | 'PUT' | 'DELETE',
  url: string | ((variables: TVariables & { id: string }) => string),
  {
    mutationFn,
    mutationKey,
    invalidate,
    onSuccess,
    ...options
  }: Partialize<UseMutationOptions<TOutput, TError, TVariables, TContext>, 'mutationKey' | 'mutationFn'> & {
    invalidate?: string[] | InvalidateQueryFilters<TOutput, TError, TVariables>[];
  } = {},
  queryClientCustom?: UseQueryParams[1]
): UseMutationResult<TOutput, TError, TVariables, TContext> & { isLoading?: boolean } => {
  const queryClientDefault = useQueryClient();
  const queryClient = queryClientCustom || queryClientDefault;

  const fetchMethod = {
    POST: postFetchJSON,
    PUT: putFetchJSON,
    DELETE: deleteFetchJSON,
  }[method];

  const result = useMutation<TOutput, TError, TVariables, TContext>({
    mutationKey: mutationKey || ([`${method.toLowerCase()} ${typeof url === 'string' ? url : 'dynamic-url'}`] as unknown as MutationKey),
    onSuccess: (data, variables, context) => {
      if (invalidate) {
        invalidate.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
      }
      onSuccess?.(data, variables, context);
    },
    mutationFn:
      mutationFn ??
      (async (variables: TVariables) => {
        const varWithId = variables as TVariables & { id: string };
        const { id, ...rest } = varWithId;
        const finalUrl = typeof url === 'function' ? url(varWithId) : url;
        return (await fetchMethod<typeof rest>(finalUrl, rest)) as TOutput;
      }),
    ...options,
  });

  return { ...result, isLoading: result.isPending };
};

// POST /static-url
export const usePost = <TVariables, TOutput = unknown, TError = Error, TContext = unknown>(
  ...args: OmitFirst<Parameters<typeof useAction<TVariables, TOutput, TError, TContext>>>
) => useAction<TVariables, TOutput, TError, TContext>('POST', ...args);

// PUT /static-url
export const usePut = <TVariables, TOutput = unknown, TError = Error, TContext = unknown>(
  ...args: OmitFirst<Parameters<typeof useAction<TVariables, TOutput, TError, TContext>>>
) => useAction<TVariables, TOutput, TError, TContext>('PUT', ...args);

// DELETE /static-url
export const useDelete = <TVariables, TOutput = unknown, TError = Error, TContext = unknown>(
  ...args: OmitFirst<Parameters<typeof useAction<TVariables, TOutput, TError, TContext>>>
) => useAction<TVariables, TOutput, TError, TContext>('DELETE', ...args);

export const usePutId = <TVariables, TOutput = unknown, TError = Error, TContext = unknown>(
  url: (variables: TVariables & { id: string }) => string,
  ...args: OmitFirst<Parameters<typeof usePut<TVariables, TOutput, TError, TContext>>>
) => {
  const result = usePut(url, ...args);
  return {
    ...result,
    mutate: (id: string, variables: TVariables) => result.mutate({ id, ...variables }),
    mutateAsync: (id: string, variables: TVariables) => result.mutateAsync({ id, ...variables }),
  };
};

// DELETE /resource/:id
export const useDeleteId = <TVariables, TOutput = unknown, TError = Error, TContext = unknown>(
  url: (variables: TVariables & { id: string }) => string,
  ...args: OmitFirst<Parameters<typeof useDelete<TVariables, TOutput, TError, TContext>>>
) => {
  const result = useDelete(url, ...args);
  return {
    ...result,
    mutate: (id: string, variables?: TVariables) => result.mutate({ id, ...(variables || ({} as TVariables)) }),
    mutateAsync: (id: string, variables?: TVariables) => result.mutateAsync({ id, ...(variables || ({} as TVariables)) }),
  };
};
