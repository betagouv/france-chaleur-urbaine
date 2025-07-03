import { useCallback } from 'react';

import { useDeleteId, useFetch, usePost, usePutId } from '@/hooks/useApi';
import { type CrudResponse } from '@/server/api/crud';
import { type DB } from '@/server/db/kysely';
import { fetchJSON } from '@/utils/network';
import { type OmitFirst } from '@/utils/typescript';

const useCrud = <T extends CrudResponse<keyof DB, any>, TListItem = T['list']['items']>(
  url: string,
  { list }: { list?: OmitFirst<Parameters<typeof useFetch<T['list']>>> } = {}
) => {
  const { mutateAsync: create, isLoading: isCreating } = usePost<NonNullable<T['createInput']>, T['create']>(url, {
    invalidate: [url],
  });

  const { mutateAsync: update, isLoadingId: isUpdatingId } = usePutId<NonNullable<T['updateInput']>, T['update']>(
    ({ id }) => `${url}/${id}`,
    {
      invalidate: [url],
    }
  );

  const { mutateAsync: remove, isLoadingId: isDeletingId } = useDeleteId<any, T['delete']>(({ id }) => `${url}/${id}`, {
    invalidate: [url],
  });

  const { data, isLoading } = useFetch<T['list']>(url, ...(list || []));

  const get = useCallback((id: string, params = {}) => fetchJSON<T['get']>(`${url}/${id}`, { params }), [url]);

  const items = (data?.items || []) as NonNullable<TListItem>;

  return {
    items,
    isLoading,
    create,
    isCreating,
    update,
    isUpdatingId,
    delete: remove,
    isDeletingId,
    get,
  };
};

export default useCrud;
