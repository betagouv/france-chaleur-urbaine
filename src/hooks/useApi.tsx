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

import { deleteFetchJSON, fetchJSON, postFetchJSON } from '@/utils/network';
import { type OmitFirst, type Partialize } from '@/utils/typescript';

type UseQueryParams = Parameters<typeof useQuery>;

export const useFetch = <TQueryFnData, TError = Error, TData = TQueryFnData, TQueryKey extends QueryKey = QueryKey>(
  url: string,
  { queryKey, queryFn, ...options }: Partialize<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, 'queryKey' | 'queryFn'>,
  queryClient?: UseQueryParams[1]
): UseQueryResult<TData, TError> => {
  return useQuery<TQueryFnData, TError, TData, TQueryKey>(
    {
      queryKey: queryKey || ([url] as unknown as TQueryKey),
      queryFn: queryFn ? queryFn : async () => fetchJSON<TQueryFnData>(url),
      ...options,
    },
    queryClient
  );
};

/**
 * Typescript values are inversed to facilitate the use of usePost with <Input,Output>
 */
const useAction = <TVariables, TOutput = unknown, TError = Error, TContext = unknown>(
  methodName: 'POST' | 'DELETE',
  url: string,
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
  let method;

  if (methodName === 'POST') {
    method = postFetchJSON;
  } else if (methodName === 'DELETE') {
    method = deleteFetchJSON;
  } else {
    throw new Error(`Invalid method name: ${methodName}. Only 'POST' or 'DELETE' are allowed.`);
  }

  const result = useMutation<TOutput, TError, TVariables, TContext>({
    mutationKey: mutationKey || ([`${methodName.toLowerCase()} ${url}`] as unknown as MutationKey),
    onSuccess: (data, variables, context) => {
      if (invalidate) {
        invalidate.forEach((key) =>
          queryClient.invalidateQueries({
            queryKey: [key],
          })
        );
      }
      onSuccess?.(data, variables, context);
    },
    mutationFn: mutationFn ? mutationFn : async (value: TVariables) => method<TVariables>(url, value) as TOutput,
    ...options,
  });

  return { ...result, isLoading: result?.isPending };
};

export const usePost = <TVariables, TOutput = unknown, TError = Error, TContext = unknown>(
  ...args: OmitFirst<Parameters<typeof useAction<TVariables, TOutput, TError, TContext>>>
) => useAction<TVariables, TOutput, TError, TContext>('POST', ...args);

export const useDelete = <TVariables, TOutput = unknown, TError = Error, TContext = unknown>(
  ...args: OmitFirst<Parameters<typeof useAction<TVariables, TOutput, TError, TContext>>>
) => useAction<TVariables, TOutput, TError, TContext>('DELETE', ...args);
