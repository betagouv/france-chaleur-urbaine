import { z } from 'zod';

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

export const ESPACE_EXTERIEUR_VALUES = ['shared', 'private', 'both', 'none'] as const;
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
    { label: 'Terrasse / Balcon', value: 'private' },
    { label: 'Jardin / cour', value: 'shared' },
    { label: 'Terrasse / Balcon ET jardin / cour', value: 'both' },
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

export type EspaceExterieurOptionLabel = (typeof espaceExterieurOptionsByTypeLogement)[TypeLogement][number]['label'];

export function getEspaceExterieurOptions(typeLogement: TypeLogement | null | undefined) {
  return typeLogement ? espaceExterieurOptionsByTypeLogement[typeLogement] : [];
}

export function getEspaceExterieurOptionLabel(typeLogement: TypeLogement, espaceExterieur: EspaceExterieur) {
  return (
    espaceExterieurOptionsByTypeLogement[typeLogement].find((option) => option.value === espaceExterieur)?.label ??
    espaceExterieurOptionsByTypeLogement[typeLogement][0].label
  );
}

const isEspaceExterieurOptionLabel = (value: unknown): value is EspaceExterieurOptionLabel =>
  typeof value === 'string' &&
  Object.values(espaceExterieurOptionsByTypeLogement).some((options) => options.some((option) => option.label === value));

export function isEspaceExterieurCompatible(
  typeLogement: TypeLogement | null | undefined,
  espaceExterieur: EspaceExterieur | null | undefined
) {
  if (!typeLogement || !espaceExterieur) return false;

  return getEspaceExterieurOptions(typeLogement).some((option) => option.value === espaceExterieur);
}

export const espaceExterieurOptions = [
  { description: 'Cour, jardin, toit terrasse…', label: 'Espaces partagés uniquement', value: 'shared' },
  { description: 'Balcons, terrasses…', label: 'Espaces individuels uniquement', value: 'private' },
  { description: 'Cour, jardin, toit terrasse, balcons…', label: 'Espaces partagés et individuels', value: 'both' },
  { label: 'Aucun espace extérieur', value: 'none' },
] satisfies readonly {
  label: string;
  description?: string;
  value: EspaceExterieur;
}[];

export const TYPE_RADIATEUR_VALUES = ['radiateur-eau', 'radiateur-electrique', 'none'];
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

export const MODE_EAU_CHAUDE_SANITAIRE_VALUES = ['non', 'equipement-chauffage', 'chauffe-eau-electrique', 'solaire-thermique'] as const;
export type ModeEauChaudeSanitaire = (typeof MODE_EAU_CHAUDE_SANITAIRE_VALUES)[number];
export const modeEauChaudeSanitaireOptions = [
  { label: 'Non', value: 'non' },
  { label: 'Avec équipement chauffage', value: 'equipement-chauffage' },
  { label: 'Chauffe-eau électrique', value: 'chauffe-eau-electrique' },
  { label: 'Solaire thermique', value: 'solaire-thermique' },
] satisfies readonly {
  label: string;
  value: ModeEauChaudeSanitaire;
}[];

export const fieldLabelInformation = {
  email: 'Email',
  phone: 'Téléphone',
};
export const OCCUPANT_STATUS_VALUES = ['Copropriétaire', 'Locataire', 'Propriétaire occupant', 'Syndic'];
export type OccupantStatus = (typeof OCCUPANT_STATUS_VALUES)[number];
export const occupantStatusOptions = OCCUPANT_STATUS_VALUES.map((value) => ({ label: value, value }));

export const HEATING_ENERGY_VALUES = ['Électricité', 'Gaz', 'Fioul', 'Bois', 'Réseau de chaleur', 'Autre'];
export type HeatingEnergy = (typeof HEATING_ENERGY_VALUES)[number];
export const heatingEnergyOptions = HEATING_ENERGY_VALUES.map((value) => ({ label: value, value }));

export const PROJECT_STATUS_VALUES = [
  'Début de réflexion',
  'DPE collectif (collectif à supprimer si maison individuelle) déjà réalisé',
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

export const zContactFormAdemeHelp = z.object({
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

export const zAirtableAdemeHelp = z.object({
  Adresse: z.string(),
  Date: z.iso.datetime(),
  DPE: z.enum(DPE_VALUES),
  Email: z.email("Votre adresse email n'est pas valide").min(1, 'Veuillez renseigner votre adresse email'),
  'Espace extérieur': z.custom<EspaceExterieurOptionLabel>(isEspaceExterieurOptionLabel),
  'Mode de chauffage': z.enum(TYPE_LOGEMENT_VALUES),
  'Nb habitant moyen': z.number(),
  Nom: z.string(),
  'Nombre de logement': z.number(),
  'Où en êtes-vous de votre projet ?': z.array(z.enum(PROJECT_STATUS_VALUES)),
  Prénom: z.string(),
  'Statut occupant': z.enum(OCCUPANT_STATUS_VALUES),
  'Surface moyenne': z.number(),
  Telephone: z
    .string()
    .regex(/^(?:(?:\+|00)33|0)\s*[1-9]\d{8}$|^$/, 'Veuillez renseigner votre numéro de téléphone sous le format 0605040302')
    .optional()
    .default(''),
  'Url simulation': z.string(),
  'Énergie de chauffage': z.enum(HEATING_ENERGY_VALUES),
});
export type GetAirtableAdeme = z.infer<typeof zAirtableAdemeHelp>;

export const zLocationInfos = z.strictObject({
  city: z.string(),
  cityCode: z.string(),
});
export type GetLocationInput = z.infer<typeof zLocationInfos>;

export const zRnbByBanIdInput = z.object({
  banId: z.string().min(1, 'banId manquant'),
});
export type RnbByBanIdInput = z.infer<typeof zRnbByBanIdInput>;
