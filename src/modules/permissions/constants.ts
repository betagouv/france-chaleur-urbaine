import type { PermissionType } from './types';

export const permissionTypeLabels: Record<PermissionType, string> = {
  commune: 'Commune',
  departement: 'Département',
  epci: 'EPCI',
  ept: 'EPT',
  national: 'National',
  region: 'Région',
  reseau_en_construction: 'En construction',
  reseau_existant: 'Réseau existant',
};

export const permissionTypeBadgeColors: Record<PermissionType, string> = {
  commune: 'bg-[#B6D7A8]',
  departement: 'bg-[#A4C2F4]',
  epci: 'bg-[#D5A6E6]',
  ept: 'bg-[#F9CB9C]',
  national: 'bg-[#EA9999]',
  region: 'bg-[#FFE599]',
  reseau_en_construction: 'bg-[#DA5DD5] text-white',
  reseau_existant: 'bg-[#48A21A] text-white',
};
