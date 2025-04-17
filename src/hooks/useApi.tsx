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
import React from 'react';

import { deleteFetchJSON, fetchJSON, postFetchJSON, putFetchJSON } from '@/utils/network';
import { type OmitFirst, type Partialize } from '@/utils/typescript';

type UseQueryParams = Parameters<typeof useQuery>;

export const useFetch = <TQueryFnData, TError = Error, TData = TQueryFnData, TQueryKey extends QueryKey = QueryKey>(
  url: string,
  fetchVariables?: Record<string, any>,
  { queryKey, queryFn, ...options }: Partialize<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, 'queryKey' | 'queryFn'> = {},
  queryClient?: UseQueryParams[1]
): UseQueryResult<TData, TError> => {
  return useQuery<TQueryFnData, TError, TData, TQueryKey>(
    {
      queryKey: queryKey || ([url] as unknown as TQueryKey),
      queryFn: queryFn ?? (() => fetchJSON<TQueryFnData>(url, { params: fetchVariables })),
      ...options,
    },
    queryClient
  );
};

const useAction = <TVariables extends object, TOutput = unknown, TError = Error, TContext = unknown>(
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
): UseMutationResult<TOutput, TError, TVariables, TContext> & { isLoading?: boolean; isLoadingId?: string } => {
  const queryClientDefault = useQueryClient();
  const queryClient = queryClientCustom || queryClientDefault;
  const [isLoadingId, setIsLoadingId] = React.useState<string | undefined>(undefined);

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
        const variablesWithId = variables as TVariables & { id: string };
        if (variablesWithId?.id) {
          setIsLoadingId(variablesWithId.id);
        }
        const { id, ...rest } = variablesWithId;
        const finalUrl = typeof url === 'function' ? url(variablesWithId) : url;
        const result = (await fetchMethod<typeof rest>(finalUrl, rest)) as TOutput;
        setIsLoadingId(undefined);
        return result;
      }),
    ...options,
  });

  return { ...result, isLoading: result.isPending, isLoadingId };
};

// POST /static-url
export const usePost = <TVariables extends object, TOutput = unknown, TError = Error, TContext = unknown>(
  ...args: OmitFirst<Parameters<typeof useAction<TVariables, TOutput, TError, TContext>>>
) => useAction<TVariables, TOutput, TError, TContext>('POST', ...args);

// PUT /static-url
export const usePut = <TVariables extends object, TOutput = unknown, TError = Error, TContext = unknown>(
  ...args: OmitFirst<Parameters<typeof useAction<TVariables, TOutput, TError, TContext>>>
) => useAction<TVariables, TOutput, TError, TContext>('PUT', ...args);

// DELETE /static-url
export const useDelete = <TVariables extends object, TOutput = unknown, TError = Error, TContext = unknown>(
  ...args: OmitFirst<Parameters<typeof useAction<TVariables, TOutput, TError, TContext>>>
) => useAction<TVariables, TOutput, TError, TContext>('DELETE', ...args);

export const usePutId = <TVariables extends object, TOutput = unknown, TError = Error, TContext = unknown>(
  url: (variables: TVariables & { id: string }) => string,
  ...args: OmitFirst<Parameters<typeof usePut<TVariables, TOutput, TError, TContext>>>
) => {
  const result = usePut(url, ...args);
  return {
    ...result,
    mutate: (id: string, variables: TVariables) => result.mutate({ id, ...variables } as TVariables),
    mutateAsync: (id: string, variables: TVariables) => result.mutateAsync({ id, ...variables } as TVariables),
  };
};

// DELETE /resource/:id
export const useDeleteId = <TVariables extends object, TOutput = unknown, TError = Error, TContext = unknown>(
  url: (variables: TVariables & { id: string }) => string,
  ...args: OmitFirst<Parameters<typeof useDelete<TVariables, TOutput, TError, TContext>>>
) => {
  const result = useDelete(url, ...args);
  return {
    ...result,
    mutate: (id: string, variables?: TVariables) => result.mutate({ id, ...(variables || ({} as TVariables)) } as TVariables),
    mutateAsync: (id: string, variables?: TVariables) => result.mutateAsync({ id, ...(variables || ({} as TVariables)) } as TVariables),
  };
};
