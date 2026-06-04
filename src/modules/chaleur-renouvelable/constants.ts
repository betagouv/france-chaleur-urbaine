import type { RuleName } from '@betagouv/france-chaleur-urbaine-publicodes';
import type { ReactNode } from 'react';
import { z } from 'zod';

import { demandStatuses } from '@/modules/demands/constants';
import type { HeatNetwork } from '@/types/HeatNetworksResponse';

export type ModeDeChauffageUsage = 'heatingAndHotWater' | 'hotWaterOnly';
export type BatEnrBatiment = {
  ac1: boolean | null;
  ac2: boolean | null;
  ac3: boolean | null;
  ac4: boolean | null;
  ac4bis: boolean | null;
  adresse: string | null;
  batiment_construction_id: string | null;
  batiment_groupe_id: string | null;
  categorie_majoritaire: string | null;
  classe_bilan_dpe: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | null;
  couv_sondes_200_2025: number | null;
  couv_st_ecs_2025: number | null;
  dpe_representatif_logement_surface_habitable_immeuble: number | null;
  etat_ppa: string | null;
  ffo_bat_nb_log: number | null;
  geometry: GeoJSON.Geometry | null;
  gis_geo_profonde: boolean | null;
  gmi_nappe_200: number | null;
  gmi_sonde_200: number | null;
  place_nappe: boolean | null;
  pot_nappe: number | null;
  prod_st_mwh_an: number | null;
  propri_uni: string | null;
  type_energie_chauffage: string | null;
  type_energie_ecs: string | null;
  type_installation_chauffage: string | null;
  type_installation_ecs: string | null;
};

export type Situation = {
  architecturalProtectionAc1: boolean;
  architecturalProtectionAc2: boolean;
  architecturalProtectionAc3: boolean;
  architecturalProtectionAc4: boolean;
  architecturalProtectionAc4bis: boolean;
  espaceExterieur: EspaceExterieur;
  planProtectionAtmosphere: boolean;
  geothermiePossible: boolean;
  dpe: DPE;
  adresse: string | null;
  nbLogements: number;
  surfaceMoyenne: number;
  habitantsMoyen: number;
  eligibiliteReseauChaleur: HeatNetwork | null;
  geothermalNappeGmi: number | null;
  geothermalNappePotential: number | null;
  geothermalSondeGmi: number | null;
  hasGeothermalProbeSpace: boolean | null;
  modeEauChaudeSanitaire: ModeEauChaudeSanitaire | null;
  solarThermalCoverage: number | null;
  typeRadiateur: TypeRadiateur | null;
};

export type IncompatibleSolutionRow = {
  label: string;
  reason: string;
  source: string;
};

export type PrerequisiteStatus = 'favorable' | 'defavorable' | 'contraignant' | 'aVerifier';

export type PrerequisiteRow = {
  label: ReactNode;
  source?: string;
  status: PrerequisiteStatus;
};

type IncompatibleSolutionRule = {
  reason: string;
  source: string;
  isIncompatible: (situation: Situation) => boolean;
};

export type ModeDeChauffage = {
  label: string;
  usage: ModeDeChauffageUsage;
  icone: string;
  pertinence: number;
  description: string;
  avantages: string[];
  inconvenients: string[];
  coutParAnPublicodeKey: string;
  coutParAnPublicodesSituation?: Partial<Record<RuleName, string | number>>;
  coutInstallation?: string | ((situation: Situation) => string);
  gainClasse: number;
  gainVsGaz?: number;
  helpAction?: 'open-heat-network-contact';
  estPossible: (situation: Situation) => boolean;
  incompatibilites?: IncompatibleSolutionRule[];
  prerequis: (situation: Situation) => PrerequisiteRow[];
};

export type ModeDeChauffageEnriched = ModeDeChauffage & {
  coutParAn: number;
  coutInstallation: string;
};

export const DPE_VALUES = ['A', 'B', 'C', 'D', 'E', 'F', 'G'] as const;

export type DPE = (typeof DPE_VALUES)[number];

export const TYPE_LOGEMENT_VALUES = ['immeuble_chauffage_collectif', 'immeuble_chauffage_individuel', 'maison_individuelle'] as const;
export type TypeLogement = (typeof TYPE_LOGEMENT_VALUES)[number];
export const typeLogementOptions = [
  { label: 'Immeuble en chauffage collectif', value: 'immeuble_chauffage_collectif' },
  { label: 'Immeuble en chauffage individuel', value: 'immeuble_chauffage_individuel' },
  { label: 'Maison individuelle', value: 'maison_individuelle' },
] satisfies readonly {
  label: string;
  value: TypeLogement;
}[];

export const ESPACE_EXTERIEUR_VALUES = [
  'shared',
  'private',
  'both',
  'terrasseBalcon',
  'jardinCours',
  'terrasseBalconEtJardinCours',
  'none',
] as const;
export type EspaceExterieur = (typeof ESPACE_EXTERIEUR_VALUES)[number];
export const espaceExterieurOptionsByTypeLogement = {
  immeuble_chauffage_collectif: [
    { label: 'Espaces extérieurs communs disponibles (cour, jardin...)', value: 'shared' },
    { label: 'Aucun espace commun disponible', value: 'none' },
  ],
  immeuble_chauffage_individuel: [
    { label: 'Espaces extérieurs privatifs disponibles (cour, jardin...)', value: 'private' },
    { label: 'Aucun espace privatif disponible', value: 'none' },
  ],
  maison_individuelle: [
    { label: 'Terrasse / balcon', value: 'terrasseBalcon' },
    { label: 'Jardin / cours', value: 'jardinCours' },
    { label: 'Terrasse / balcon ET jardin / cours', value: 'terrasseBalconEtJardinCours' },
    { label: 'Aucun espace extérieur disponible', value: 'none' },
  ],
} satisfies Record<
  TypeLogement,
  readonly {
    label: string;
    description?: string;
    value: EspaceExterieur;
  }[]
>;

export function getEspaceExterieurOptions(typeLogement: TypeLogement | null | undefined) {
  return typeLogement ? espaceExterieurOptionsByTypeLogement[typeLogement] : [];
}

export function getEspaceExterieurOptionLabel(typeLogement: TypeLogement, espaceExterieur: EspaceExterieur) {
  return (
    espaceExterieurOptionsByTypeLogement[typeLogement].find((option) => option.value === espaceExterieur)?.label ??
    espaceExterieurOptionsByTypeLogement[typeLogement][0].label
  );
}

export function isEspaceExterieurCompatible(
  typeLogement: TypeLogement | null | undefined,
  espaceExterieur: EspaceExterieur | null | undefined
) {
  if (!typeLogement || !espaceExterieur) return false;

  return getEspaceExterieurOptions(typeLogement).some((option) => option.value === espaceExterieur);
}

export const MODE_EAU_CHAUDE_SANITAIRE_VALUES = ['Individuel', 'Collectif'] as const;
export type ModeEauChaudeSanitaire = (typeof MODE_EAU_CHAUDE_SANITAIRE_VALUES)[number];
export const modeEauChaudeSanitaireOptions = [
  { label: 'Individuel', value: 'Individuel' },
  { label: 'Collectif', value: 'Collectif' },
] satisfies readonly {
  label: string;
  value: ModeEauChaudeSanitaire;
}[];

export const TYPE_RADIATEUR_VALUES = ['radiateur-eau', 'radiateur-electrique', 'none'] as const;
export type TypeRadiateur = (typeof TYPE_RADIATEUR_VALUES)[number];
export const typeRadiateurOptions = [
  { icone: 'img/icon-goutte.svg', label: 'Radiateur ou plancher chauffant à eau', value: 'radiateur-eau' },
  { icone: 'img/icon-eclair.svg', label: 'Radiateur ou plancher chauffant électrique', value: 'radiateur-electrique' },
  { icone: 'img/icon-clim.svg', label: 'Autre : climatiseur, ...', value: 'none' },
] satisfies readonly {
  label: string;
  icone?: string;
  description?: string;
  value: TypeRadiateur;
}[];

export const OCCUPANT_STATUS_VALUES = ['Copropriétaire', 'Locataire', 'Propriétaire occupant', 'Syndic'];
export type OccupantStatus = (typeof OCCUPANT_STATUS_VALUES)[number];
export const occupantStatusOptions = OCCUPANT_STATUS_VALUES.map((value) => ({ label: value, value }));

export const HEATING_ENERGY_VALUES = ['Électricité', 'Gaz', 'Fioul', 'Bois', 'Réseau de chaleur', 'Autre'];
export type HeatingEnergy = (typeof HEATING_ENERGY_VALUES)[number];
export const heatingEnergyOptions = HEATING_ENERGY_VALUES.map((value) => ({ label: value, value }));

export const PROJECT_STATUS_VALUES = [
  'Début de réflexion',
  'DPE déjà réalisé',
  'Audit énergétique déjà réalisé',
  'Projet de rénovation globale en cours',
  'Devis de changement de chauffage déjà reçus',
  'Changement de chauffage voté en AG',
  "Déjà accompagné par un bureau d'étude",
];
export type ProjectStatus = (typeof PROJECT_STATUS_VALUES)[number];
export const projectStatusOptions = PROJECT_STATUS_VALUES.map((value) => ({
  label: value,
  nativeInputProps: { value },
}));

export const DEFAULT_SIMULATION_PARAMS = {
  espaceExterieur: 'none',
  habitantsMoyen: 2,
  nbLogements: 25,
  surfaceMoyenne: 70,
  typeLogement: 'immeuble_chauffage_collectif',
} satisfies {
  espaceExterieur: EspaceExterieur;
  habitantsMoyen: number;
  nbLogements: number;
  surfaceMoyenne: number;
  typeLogement: TypeLogement;
};

export const zContactFormChaleuRenouvelable = z.object({
  email: z.email("Votre adresse email n'est pas valide").min(1, 'Veuillez renseigner votre adresse email'),
  firstName: z.string().min(1, 'Veuillez renseigner votre prénom'),
  heatingEnergy: z.enum(HEATING_ENERGY_VALUES),
  lastName: z.string().min(1, 'Veuillez renseigner votre nom'),
  occupantStatus: z.enum(OCCUPANT_STATUS_VALUES),
  phone: z
    .string()
    .regex(/^(?:(?:\+|00)33|0)\s*[1-9]\d{8}$|^$/, 'Veuillez renseigner votre numéro de téléphone sous le format 0605040302')
    .optional()
    .default(''),
  projectStatus: z.array(z.enum(PROJECT_STATUS_VALUES)).default([]),
  termOfUse: z.boolean().refine((val) => val, {
    error: 'Ce champ est requis',
  }),
});

export const zDemandeChaleurRenouvelable = z.object({
  address: z.string(),
  averageArea: z.number(),
  averageResidents: z.number(),
  batimentConstructionId: z.string().nullable().default(null),
  dpe: z.enum(DPE_VALUES),
  email: z.email("Votre adresse email n'est pas valide").min(1, 'Veuillez renseigner votre adresse email'),
  firstName: z.string(),
  heatingEnergy: z.enum(HEATING_ENERGY_VALUES),
  hotWaterSystemType: z.enum(MODE_EAU_CHAUDE_SANITAIRE_VALUES).nullable().default(null),
  housingCount: z.number(),
  housingType: z.enum(TYPE_LOGEMENT_VALUES),
  isPublicAdvisorSelected: z.boolean().default(false),
  lastName: z.string(),
  occupantStatus: z.enum(OCCUPANT_STATUS_VALUES),
  outdoorSpace: z.enum(ESPACE_EXTERIEUR_VALUES),
  phone: z
    .string()
    .regex(/^(?:(?:\+|00)33|0)\s*[1-9]\d{8}$|^$/, 'Veuillez renseigner votre numéro de téléphone sous le format 0605040302')
    .optional()
    .default(''),
  projectStatus: z.array(z.enum(PROJECT_STATUS_VALUES)),
  radiatorType: z.enum(TYPE_RADIATEUR_VALUES).nullable().default(null),
  refusalPeriod: z.string().nullable().default(null),
  refusalReason: z.string().nullable().default(null),
  simulationUrl: z.string(),
});
export type DemandeChaleurRenouvelable = z.infer<typeof zDemandeChaleurRenouvelable>;

export const zAdminUpdateDemandeChaleurRenouvelableInput = z.object({
  demandId: z.string(),
  values: z
    .object({
      assignedTo: z.string().nullable(),
      status: z.enum(demandStatuses.map((status) => status.label)),
    })
    .partial(),
});
export type AdminUpdateDemandeChaleurRenouvelableInput = z.infer<typeof zAdminUpdateDemandeChaleurRenouvelableInput>;

export const zLocationInfos = z.strictObject({
  city: z.string(),
  cityCode: z.string(),
});
export type GetLocationInput = z.infer<typeof zLocationInfos>;

export const zBatEnrByBanIdInput = z.object({
  banId: z.string().min(1, 'banId manquant'),
});
export type BatEnrByBanIdInput = z.infer<typeof zBatEnrByBanIdInput>;
