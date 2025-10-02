import type { ChipOption } from '@/components/ui/ChipAutoComplete';
import type { TagWithUsers } from '@/modules/tags/server/service';

export const tagsGestionnairesStyleByType = {
  '': { className: 'not-[&:hover]:bg-[#787878]! hover:bg-[#606060]! text-white!', title: 'Inconnu' },
  gestionnaire: { className: 'not-[&:hover]:bg-[#7a40b4]! hover:bg-[#613390]! text-white!', title: 'Gestionnaire tête de réseau' },
  metropole: { className: 'not-[&:hover]:bg-[#3562bb]! hover:bg-[#294c94]! text-white!', title: 'Métropole' },
  reseau: { className: 'not-[&:hover]:bg-[#ba474c]! hover:bg-[#94383c]! text-white!', title: 'Réseau spécifique' },
  ville: { className: 'not-[&:hover]:bg-[#42a835]! hover:bg-[#348029]! text-white!', title: 'Ville' },
};

export const fcuTagsToChipOptions = (tags: TagWithUsers[]): ChipOption[] =>
  tags.map((tag) => ({
    className: tagsGestionnairesStyleByType[tag.type as keyof typeof tagsGestionnairesStyleByType]?.className,
    key: tag.name,
    label: `${tag.name} (${tag.users?.length ?? 0})`,
    title: tag.users?.map((user) => user.email).join(', '),
  }));

export const defaultTagChipOption: ChipOption = { ...tagsGestionnairesStyleByType[''], key: '', label: '', title: '' };
