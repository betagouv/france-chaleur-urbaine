import { z } from 'zod';

import { clientConfig } from '@/client-config';
import { businessRules } from '@/modules/app/business-rules';
import { zGeometry } from '@/utils/validation';

/** Documents (PDF or zip) published on the page of a heat or cold network. */
export const MAX_NETWORK_DOCUMENTS = 3;

/** Footnote shown wherever a gestionnaire corrected by FCU (`gestionnaire_fcu` set) is displayed. */
export const sourcesActualiseesParFcuNotice = '** Sources actualisées par France Chaleur Urbaine';

/** The displayed gestionnaire, with the footnote reference when it is a FCU correction of the FEDENE survey value. */
export const withSourceFcuMark = (
  gestionnaire: string | null | undefined,
  gestionnaireFcu: string | boolean | null | undefined
): string | null => (gestionnaire ? (gestionnaireFcu ? `${gestionnaire} **` : gestionnaire) : null);

/** Comparison key of a name / gestionnaire / MO value: the FEDENE survey and the admin spell them with varying case and spaces. */
export const normalizeNetworkValue = (value: string | null | undefined): string => (value ?? '').trim().toLowerCase();

// Les 4 entités réseau (clé canonique : singulier, snake_case).
// Réutilisée comme valeur pour : `network_reminders.network_type`, `permissions.type` (sous-ensemble), `events.context_type`.
export const networkEntityTypes = [
  'reseau_de_chaleur',
  'reseau_de_froid',
  'reseau_en_construction',
  'perimetre_de_developpement_prioritaire',
] as const;
export type NetworkEntityType = (typeof networkEntityTypes)[number];

// Sous-ensemble pour `demands.network_type` (les demandes ne ciblent que ces 2 entités).
export const networkTypes = ['reseau_de_chaleur', 'reseau_en_construction'] as const satisfies readonly NetworkEntityType[];
export type NetworkType = (typeof networkTypes)[number];

export const reminderTypes = ['demand', 'trace'] as const;
export type ReminderType = (typeof reminderTypes)[number];

export const networkEntityToTable = {
  perimetre_de_developpement_prioritaire: 'zone_de_developpement_prioritaire',
  reseau_de_chaleur: 'reseaux_de_chaleur',
  reseau_de_froid: 'reseaux_de_froid',
  reseau_en_construction: 'zones_et_reseaux_en_construction',
} as const satisfies Record<
  NetworkEntityType,
  'reseaux_de_chaleur' | 'reseaux_de_froid' | 'zones_et_reseaux_en_construction' | 'zone_de_developpement_prioritaire'
>;

export const networkSlugToEntity = {
  'perimetres-de-developpement-prioritaire': 'perimetre_de_developpement_prioritaire',
  'reseaux-de-chaleur': 'reseau_de_chaleur',
  'reseaux-de-froid': 'reseau_de_froid',
  'reseaux-en-construction': 'reseau_en_construction',
} as const satisfies Record<
  'reseaux-de-chaleur' | 'reseaux-de-froid' | 'reseaux-en-construction' | 'perimetres-de-developpement-prioritaire',
  NetworkEntityType
>;

export const tableToNetworkEntity = {
  reseaux_de_chaleur: 'reseau_de_chaleur',
  reseaux_de_froid: 'reseau_de_froid',
  zone_de_developpement_prioritaire: 'perimetre_de_developpement_prioritaire',
  zones_et_reseaux_en_construction: 'reseau_en_construction',
} as const satisfies Record<(typeof networkEntityToTable)[NetworkEntityType], NetworkEntityType>;

/**
 * Détermine la table réseau à partir du suffixe de l'identifiant SNCU.
 * `…C` → réseau de chaleur, `…F` → réseau de froid, sinon `null`.
 */
export function networkTableForId(id_sncu: string): 'reseaux_de_chaleur' | 'reseaux_de_froid' | null {
  if (id_sncu.endsWith('C')) return 'reseaux_de_chaleur';
  if (id_sncu.endsWith('F')) return 'reseaux_de_froid';
  return null;
}

const tableNames = [
  'reseaux_de_chaleur',
  'zones_et_reseaux_en_construction',
  'zone_de_developpement_prioritaire',
  'reseaux_de_froid',
] as const;

// Geometry updates types
export const zApplyGeometriesUpdatesInput = z.strictObject({
  name: z.enum(['reseaux-de-chaleur', 'reseaux-de-froid', 'reseaux-en-construction', 'perimetres-de-developpement-prioritaire'], {
    message: 'Le nom de la table est invalide',
  }),
});

export type ApplyGeometriesUpdatesInput = z.infer<typeof zApplyGeometriesUpdatesInput>;

export const zUpdateGeomUpdateInput = z.object({
  geometry: zGeometry,
  id: z.number(),
  type: z.enum(tableNames),
});

export type UpdateGeomUpdateInput = z.infer<typeof zUpdateGeomUpdateInput>;

// Le SNCU du PDP n'est pas éditable : il est recopié depuis le RC lié par la synchronisation
export const zUpdatePerimetreDeDeveloppementPrioritaireInput = z.object({
  Gestionnaire: z.string().nullable().optional(),
  id: z.number(),
  MO: z.string().nullable().optional(),
  reseau_de_chaleur_ids: z.array(z.number()).optional(),
  reseau_en_construction_ids: z.array(z.number()).optional(),
});

export type UpdatePerimetreDeDeveloppementPrioritaireInput = z.infer<typeof zUpdatePerimetreDeDeveloppementPrioritaireInput>;

// Le SNCU du réseau en construction n'est pas éditable : il est recopié depuis le RC parent par la synchronisation
export const zUpdateReseauEnConstructionInput = z.object({
  gestionnaire: z.string().nullable().optional(),
  id: z.number(),
  MO: z.string().nullable().optional(),
  mise_en_service: z.string().nullable().optional(),
  nom_reseau: z.string().min(1).optional(),
  ouvert_aux_raccordements: z.boolean().optional(),
  reseau_de_chaleur_id: z.number().nullable().optional(),
});

export type UpdateReseauEnConstructionInput = z.infer<typeof zUpdateReseauEnConstructionInput>;

// Admin-owned fields of heat and cold networks (never overwritten by the yearly FEDENE / SDES imports)
export const zUpdateReseauDeChaleurInput = z.object({
  Gestionnaire: z.string().nullable().optional(),
  'Identifiant reseau': z.string().nullable().optional(),
  id: z.number(),
  informationsComplementaires: z.string().trim().max(clientConfig.networkInfoFieldMaxCharacters).nullable().optional(),
  MO: z.string().nullable().optional(),
  nom_reseau: z.string().min(1).optional(),
  ouvert_aux_raccordements: z.boolean().optional(),
  'reseaux classes': z.boolean().optional(),
  website_gestionnaire: z.string().trim().nullable().optional(),
});

export type UpdateReseauDeChaleurInput = z.infer<typeof zUpdateReseauDeChaleurInput>;

export const zUpdateReseauDeFroidInput = zUpdateReseauDeChaleurInput;

export type UpdateReseauDeFroidInput = z.infer<typeof zUpdateReseauDeFroidInput>;

export const zDeleteGeomUpdateInput = z.object({
  id: z.number(),
  type: z.enum(tableNames),
});

export type DeleteGeomUpdateInput = z.infer<typeof zDeleteGeomUpdateInput>;

export const zDeleteNetworkInput = z.object({
  id: z.number(),
  type: z.enum(tableNames),
});

export type DeleteNetworkInput = z.infer<typeof zDeleteNetworkInput>;

// Pas de métadonnées à la création : la fenêtre de modification s'ouvre juste après pour les saisir
export const zCreateNetworkInput = z.object({
  geometry: zGeometry,
  // optional SNCU (or numeric id_fcu) for heat / cold networks, used by the CLI; the admin creates from the trace alone and
  // fills the identifiers in the edit dialog, the id_fcu being attributed automatically (max + 1)
  id: z.string().optional(),
  type: z.enum(tableNames),
});

export type CreateNetworkInput = z.infer<typeof zCreateNetworkInput>;

export const zDownloadNetworkGeometryInput = z.object({
  id: z.number(),
  type: z.enum(tableNames),
});

export type DownloadNetworkGeometryInput = z.infer<typeof zDownloadNetworkGeometryInput>;

/** Shown next to any price flagged with an asterisk (out of the plausibility bounds). */
export const prixReseauHorsBornesNotice = '*Pour connaître le prix, veuillez vous adresser directement au gestionnaire du réseau';

/** A price below the threshold (0 €, cents) means "not communicated" in FEDENE data. */
export const isPrixReseauCommunique = (price: number | null | undefined): price is number =>
  typeof price === 'number' && price >= businessRules.heatNetworkPriceCommunicatedMin.value;

/** A communicated price outside the plausibility bounds is displayed with an asterisk and not used in computations. */
export const isPrixReseauHorsBornes = (price: number | null | undefined): boolean =>
  isPrixReseauCommunique(price) && (price < businessRules.heatNetworkPriceMin.value || price > businessRules.heatNetworkPriceMax.value);

/** Price usable in computations (comparateur): communicated and within the plausibility bounds, else undefined. */
export const getPrixReseauFiable = (price: number | null | undefined): number | undefined =>
  isPrixReseauCommunique(price) && !isPrixReseauHorsBornes(price) ? price : undefined;

export const gestionnairesFilters = [
  {
    label: 'Coriance',
    value: 'coriance',
  },
  { label: 'Dalkia', value: 'dalkia' },
  { label: 'ENGIE Solutions', value: 'engie' },
  { label: 'IDEX', value: 'idex' },
  { label: 'Autre', value: 'autre' },
];
