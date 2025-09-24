import { useMemo } from 'react';

import { type ChipOption } from '@/components/ui/ChipAutoComplete';
import { useFetch } from '@/hooks/useApi';

import { type TagsResponse, type TagWithUsers } from './types';

export const tagsGestionnairesStyleByType = {
  ville: { title: 'Ville', className: '[&:not(:hover)]:!bg-[#42a835] hover:!bg-[#348029] !text-white' },
  metropole: { title: 'Métropole', className: '[&:not(:hover)]:!bg-[#3562bb] hover:!bg-[#294c94] !text-white' },
  gestionnaire: { title: 'Gestionnaire tête de réseau', className: '[&:not(:hover)]:!bg-[#7a40b4] hover:!bg-[#613390] !text-white' },
  reseau: { title: 'Réseau spécifique', className: '[&:not(:hover)]:!bg-[#ba474c] hover:!bg-[#94383c] !text-white' },
  '': { title: 'Inconnu', className: '[&:not(:hover)]:!bg-[#787878] hover:!bg-[#606060] !text-white' },
};

export const useFCUTags = () => {
  const { data } = useFetch<TagsResponse['list']>('/api/admin/tags', {}, { staleTime: 60_000 });

  const tags = (data?.items ?? []) as unknown as TagWithUsers[];

  const tagsOptions: ChipOption[] = useMemo(() => (tags ? fcuTagsToChipOptions(tags) : []), [tags]);
  return { tags, tagsOptions };
};

export const fcuTagsToChipOptions = (tags: TagWithUsers[]): ChipOption[] =>
  tags.map((tag) => ({
    key: tag.name,
    label: `${tag.name} (${tag.users?.length ?? 0})`,
    className: tagsGestionnairesStyleByType[tag.type as keyof typeof tagsGestionnairesStyleByType]?.className,
    title: tag.users?.map((user) => user.email).join(', '),
  }));

export const defaultTagChipOption: ChipOption = { ...tagsGestionnairesStyleByType[''], title: '', key: '', label: '' };
