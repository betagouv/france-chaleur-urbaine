import { useMemo } from 'react';

import { type ChipOption } from '@/components/ui/ChipAutoComplete';
import { useFetch } from '@/hooks/useApi';
import { fcuTagsToChipOptions } from '@/modules/tags/constants';
import { type TagsResponse } from '@/modules/tags/server/api-admin';
import { type TagWithUsers } from '@/modules/tags/server/service';

export const useFCUTags = () => {
  const { data } = useFetch<TagsResponse['list']>('/api/admin/tags', {}, { staleTime: 60_000 });

  const tags = (data?.items ?? []) as unknown as TagWithUsers[];

  const tagsOptions: ChipOption[] = useMemo(() => (tags ? fcuTagsToChipOptions(tags) : []), [tags]);
  return { tags, tagsOptions };
};

export default useFCUTags;
