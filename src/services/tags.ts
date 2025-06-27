import { useMemo } from 'react';

import { type ChipOption } from '@/components/ui/ChipAutoComplete';
import { useFetch } from '@/hooks/useApi';

export const tagsGestionnairesStyleByType = {
  ville: { title: 'Ville', className: '[&:not(:hover)]:!bg-[#42a835] hover:!bg-[#348029] !text-white' },
  metropole: { title: 'Métropole', className: '[&:not(:hover)]:!bg-[#3562bb] hover:!bg-[#294c94] !text-white' },
  gestionnaire: { title: 'Gestionnaire tête de réseau', className: '[&:not(:hover)]:!bg-[#7a40b4] hover:!bg-[#613390] !text-white' },
  reseau: { title: 'Réseau spécifique', className: '[&:not(:hover)]:!bg-[#ba474c] hover:!bg-[#94383c] !text-white' },
  '': { title: 'Inconnu', className: '[&:not(:hover)]:!bg-[#787878] hover:!bg-[#606060] !text-white' },
};

export const useFCUTags = () => {
  const { data: tagsResponse } = useFetch<{ items: Array<{ id: string; name: string; type: string }> }>('/api/admin/tags');

  const tagsOptions: ChipOption[] = useMemo(() => {
    return tagsResponse?.items
      ? tagsResponse.items.map((tag) => ({
          name: tag.name,
          type: tag.type,
          className: tagsGestionnairesStyleByType[tag.type as keyof typeof tagsGestionnairesStyleByType]?.className,
        }))
      : [];
  }, [tagsResponse]);
  return { tags: tagsResponse?.items ?? [], tagsOptions };
};

export const fcuTagsToOptions = (tags: Array<{ id: string; name: string; type: string }>) =>
  tags.map((tag) => ({
    name: tag.name,
    type: tag.type,
    className: tagsGestionnairesStyleByType[tag.type as keyof typeof tagsGestionnairesStyleByType]?.className,
  }));
