import type { UserRole } from '@/types/enum/UserRole';

export const ROLE_TYPE_ORGANISME: Partial<Record<UserRole, string>> = {
  gestionnaire: 'Entreprise',
  particulier: 'Particulier',
  professionnel: 'Entreprise',
};
