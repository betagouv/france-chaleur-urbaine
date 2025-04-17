import { useDeleteId, useFetch, usePost, usePutId } from '@/hooks/useApi';
import { type CrudResponse } from '@/server/api/crud';
import { type DB } from '@/server/db/kysely';

const useCrud = <T extends CrudResponse<keyof DB>>(url: string) => {
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

  const { data, isLoading } = useFetch<T['list']>(url);
  const items = (data?.items || []) as NonNullable<T['list']['items']>;

  return {
    items,
    isLoading,
    create,
    isCreating,
    update,
    isUpdatingId,
    delete: remove,
    isDeletingId,
  };
};

export default useCrud;
