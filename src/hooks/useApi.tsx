import {
  type InvalidateQueryFilters,
  type MutationKey,
  type QueryKey,
  type UseMutationOptions,
  type UseMutationResult,
  type UseQueryOptions,
  type UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import React from 'react';

import { deleteFetchJSON, fetchJSON, postFetchJSON, putFetchJSON } from '@/utils/network';
import type { OmitFirst, Partialize } from '@/utils/typescript';

type UseQueryParams = Parameters<typeof useQuery>;

export const useFetch = <TQueryFnData, TError = Error, TData = TQueryFnData, TQueryKey extends QueryKey = QueryKey>(
  url: string,
  fetchVariables?: Record<string, any>,
  { queryKey, queryFn, ...options }: Partialize<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, 'queryKey' | 'queryFn'> = {},
  queryClient?: UseQueryParams[1]
): UseQueryResult<TData, TError> => {
  return useQuery<TQueryFnData, TError, TData, TQueryKey>(
    {
      queryFn: queryFn ?? (() => fetchJSON<TQueryFnData>(url, fetchVariables ? { params: fetchVariables } : undefined)),
      queryKey: queryKey || ([url] as unknown as TQueryKey),
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
    invalidate?: string[] | InvalidateQueryFilters[];
  } = {},
  queryClientCustom?: UseQueryParams[1]
): UseMutationResult<TOutput, TError, TVariables, TContext> & { isLoading?: boolean; isLoadingId?: string } => {
  const queryClientDefault = useQueryClient();
  const queryClient = queryClientCustom || queryClientDefault;
  const [isLoadingId, setIsLoadingId] = React.useState<string | undefined>(undefined);

  const fetchMethod = {
    DELETE: deleteFetchJSON,
    POST: postFetchJSON,
    PUT: putFetchJSON,
  }[method];

  const result = useMutation<TOutput, TError, TVariables, TContext>({
    mutationFn:
      mutationFn ??
      (async (variables: TVariables | string) => {
        const variablesWithId = variables as TVariables & { id: string };
        let parameters;
        if (variablesWithId?.id) {
          setIsLoadingId(variablesWithId.id);
          const { id, ...rest } = variablesWithId;
          parameters = rest;
        } else {
          parameters = variables;
        }

        const finalUrl = typeof url === 'function' ? url(variablesWithId) : url;
        const result = (await fetchMethod<typeof parameters>(finalUrl, parameters)) as TOutput;
        setIsLoadingId(undefined);
        return result;
      }),
    mutationKey: mutationKey || ([`${method.toLowerCase()} ${typeof url === 'string' ? url : 'dynamic-url'}`] as unknown as MutationKey),
    onSuccess: (data, variables, context, mutationContext) => {
      if (invalidate) {
        invalidate.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
      }
      onSuccess?.(data, variables, context, mutationContext);
    },
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
) => {
  const result = useAction<TVariables, TOutput, TError, TContext>('PUT', ...args);
  return {
    ...result,
    mutate: (id: string, variables: TVariables) => result.mutate({ id, ...variables } as TVariables),
    mutateAsync: (id: string, variables: TVariables) => result.mutateAsync({ id, ...variables } as TVariables),
  };
};

// DELETE /static-url
export const useDelete = <TVariables extends object, TOutput = unknown, TError = Error, TContext = unknown>(
  ...args: OmitFirst<Parameters<typeof useAction<TVariables, TOutput, TError, TContext>>>
) => {
  const result = useAction<TVariables, TOutput, TError, TContext>('DELETE', ...args);
  return {
    ...result,
    mutate: (id: string, variables?: TVariables) => result.mutate({ id, ...variables } as TVariables),
    mutateAsync: (id: string, variables?: TVariables) => result.mutateAsync({ id, ...variables } as TVariables),
  };
};

export const usePutId = <TVariables extends object, TOutput = unknown, TError = Error, TContext = unknown>(
  url: (variables: TVariables & { id: string }) => string,
  ...args: OmitFirst<Parameters<typeof usePut<TVariables, TOutput, TError, TContext>>>
) => usePut(url, ...args);

// DELETE /resource/:id
export const useDeleteId = <TVariables extends object, TOutput = unknown, TError = Error, TContext = unknown>(
  url: (variables: TVariables & { id: string }) => string,
  ...args: OmitFirst<Parameters<typeof useDelete<TVariables, TOutput, TError, TContext>>>
) => useDelete(url, ...args);
