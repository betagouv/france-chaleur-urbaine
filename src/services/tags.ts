import { useMemo } from 'react';

import { type ChipOption } from '@/components/ui/ChipAutoComplete';
import { useFetch } from '@/hooks/useApi';

export const tagsGestionnairesStyleByType = {
  ville: { title: 'Ville', className: '!bg-[#42a835] !text-white' },
  metropole: { title: 'Métropole', className: '!bg-[#3562bb] !text-white' },
  gestionnaire: { title: 'Gestionnaire tête de réseau', className: '!bg-[#7a40b4] !text-white' },
  reseau: { title: 'Réseau spécifique', className: '!bg-[#ba474c] !text-white' },
  '': { title: 'Inconnu', className: '!bg-[#787878] !text-white' },
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
