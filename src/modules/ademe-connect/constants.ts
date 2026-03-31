import type { StructureType } from '@/modules/users/constants';
import type { UserRole } from '@/types/enum/UserRole';

export const ROLE_TYPE_ORGANISME: Partial<Record<UserRole, string>> = {
  gestionnaire: 'Entreprise',
  particulier: 'Particulier',
  professionnel: 'Entreprise',
};

// biome-ignore assist/source/useSortedKeys: keep order matching the rubriques list expected on ADEME Connect
const ROLE_RUBRIQUES: Partial<Record<UserRole, string>> = {
  particulier: 'FCU - rôle particulier',
  professionnel: 'FCU - rôle professionnel',
  gestionnaire: 'FCU - rôle gestionnaire',
  collectivite: 'FCU - rôle collectivité',
  alec: 'FCU - rôle ALEC',
};

const STRUCTURE_RUBRIQUES: Partial<Record<StructureType, string>> = {
  alec: 'FCU - structure ALEC',
  autre: 'FCU - structure Autre',
  bailleur_social: 'FCU - structure Bailleur social',
  bureau_etudes: "FCU - structure Bureau d'études",
  collectivite: 'FCU - structure Collectivité',
  gestionnaire_parc_tertiaire: 'FCU - structure Gestionnaire de parc tertiaire',
  gestionnaire_reseaux: 'FCU - structure Gestionnaire de réseau de chaleur',
  mandataire_cee: 'FCU - structure Mandataire / délégataire CEE',
  syndic_copropriete: 'FCU - structure Syndic de copropriété',
};

/**
 * All FCU rubriques managed by this app on ADEME Connect.
 * Used as `rubriquesASupprimer` on update so the contact ends up with only the rubriques
 * we send in `rubriques` (full sync of FCU rubriques, leaves non-FCU rubriques untouched).
 */
export const ALL_FCU_RUBRIQUES: string[] = [...Object.values(ROLE_RUBRIQUES), ...Object.values(STRUCTURE_RUBRIQUES)];

/**
 * Builds the `rubriques` array for ADEME Connect from a user's role and structure type.
 * Returns undefined if no rubrique can be built.
 */
export const buildRubriques = (role?: UserRole | null, structureType?: StructureType | null): string[] | undefined => {
  const items = [role && ROLE_RUBRIQUES[role], structureType && STRUCTURE_RUBRIQUES[structureType]].filter((v): v is string => !!v);
  return items.length > 0 ? items : undefined;
};
