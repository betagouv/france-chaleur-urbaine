import type { UserRole } from '@/types/enum/UserRole';

export const ROLE_TYPE_ORGANISME: Partial<Record<UserRole, string>> = {
  gestionnaire: 'Entreprise',
  particulier: 'Particulier',
  professionnel: 'Entreprise',
};

/**
 * Builds the `rubriques` array for ADEME Connect from pre-resolved labels.
 * - roleLabel: human-readable role name (e.g. "Particulier")
 * - structureLabel: human-readable structure type label (e.g. "Bailleur social")
 * Returns undefined if no rubrique can be built.
 */
export const buildRubriques = (roleLabel?: string | null, structureLabel?: string | null): string[] | undefined => {
  const items = [roleLabel ? `FCU - compte ${roleLabel}` : null, structureLabel ? `FCU - type ${structureLabel}` : null].filter(
    (v) => !!v
  ) as string[];
  return items.length > 0 ? items : undefined;
};
