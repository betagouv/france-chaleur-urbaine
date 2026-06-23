import type { PermissionType } from './types';

export const permissionTypeLabels: Record<PermissionType, string> = {
  commune: 'Commune',
  departement: 'Département',
  epci: 'EPCI',
  ept: 'EPT',
  national: 'National',
  organization: 'Organisation',
  region: 'Région',
  reseau_de_chaleur: 'Réseau de chaleur',
  reseau_en_construction: 'En construction',
};

export const permissionTypeBadgeColors: Record<PermissionType, string> = {
  commune: 'bg-[#B6D7A8]',
  departement: 'bg-[#A4C2F4]',
  epci: 'bg-[#D5A6E6]',
  ept: 'bg-[#F9CB9C]',
  national: 'bg-[#EA9999]',
  organization: 'bg-[#1F7A8C] text-white',
  region: 'bg-[#FFE599]',
  reseau_de_chaleur: 'bg-[#48A21A] text-white',
  reseau_en_construction: 'bg-[#DA5DD5] text-white',
};
