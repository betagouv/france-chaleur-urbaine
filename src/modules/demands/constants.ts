import { z } from 'zod';

import type { EligibilityType } from '@/server/services/addresseInformation';
import { DEMANDE_STATUS } from '@/types/enum/DemandSatus';
import { type ExtractKeys, nonEmptyArray } from '@/utils/typescript';

export const zAddRelanceCommentInput = z.object({
  comment: z.string().min(1, 'Le commentaire est requis'),
  relanceId: z.string(),
});

export const zDeleteDemandInput = z.object({
  demandId: z.string(),
});

export const zListEmailsInput = z.object({
  demand_id: z.string(),
});

export const zSendEmailInput = z.object({
  demand_id: z.string(),
  emailContent: z.object({
    body: z.string().transform((v) => {
      return v.replace(/(?:\r\n|\r|\n)/g, '<br />');
    }),
    cc: z.preprocess((v) => {
      const str = String(v);
      return str ? str.split(',') : [];
    }, z.array(z.string().email().trim())),
    object: z.string(),
    replyTo: z.string().trim(),
    signature: z.string(),
    to: z.string().email().trim(),
  }),
  key: z.string(),
});

// Source unique des statuts : l'enum DEMANDE_STATUS porte les libellés ; cette liste ne fait
// qu'ajouter l'ordre d'affichage et le picto (⚠️ uniquement dans la liste déroulante).
export const demandStatuses = [
  { icon: '⚠️', label: DEMANDE_STATUS.TO_PROCESS },
  { label: DEMANDE_STATUS.UNREALISABLE },
  { label: DEMANDE_STATUS.RECONTACTED },
  { label: DEMANDE_STATUS.COMMERCIAL_PROPOSAL },
  { label: DEMANDE_STATUS.VOTED },
  { label: DEMANDE_STATUS.WORK_IN_PROGRESS },
  { label: DEMANDE_STATUS.DONE },
  { label: DEMANDE_STATUS.ABANDONNED },
] as const;

export const demandStatusDefault = demandStatuses[0].label;

export type DemandStatus = DEMANDE_STATUS;

/**
 * Libellé de statut présenté au demandeur. « À traiter » relève de la file de traitement interne des gestionnaires :
 * on le neutralise en « En cours de traitement ». Les autres statuts restent inchangés.
 */
export const getDemandeurStatusLabel = (status: DemandStatus): string =>
  status === DEMANDE_STATUS.TO_PROCESS ? 'En cours de traitement' : status;

const zDemandStatus = z.enum([...demandStatuses.map((s) => s.label), '']);

// Zod schema for demand update values - only fields actually used in updateDemand calls
// Analysis based on all updateDemand usage across the codebase
const zGestionnaireDemandUpdateValues = z
  // biome-ignore assist/source/useSortedKeys: keep field order for clarity and maintainability
  .object({
    // Network info
    'Gestionnaire Distance au réseau': z.number().nullable(),

    // Status & Contact
    Status: zDemandStatus,

    // Communication
    comment_gestionnaire: z.string().nullable(),

    // Additional info
    'Gestionnaire Conso': z.number().nullable(),
    'Gestionnaire Logement': z.number().nullable(),
    'Surface en m2': z.number().nullable(),
  })
  .partial();

export type UpdateGestionnaireDemandInput = z.infer<typeof zGestionnaireDemandUpdateValues>;

export const zAdminDemandUpdateValues = z
  // biome-ignore assist/source/useSortedKeys: keep field order for clarity and maintainability
  .object({
    // Status & Contact
    Status: zDemandStatus,
    'Relance à activer': z.boolean(),
    'Relance ID': z.string().nullable(),
    'Notification envoyé': z.string().nullable(),
    'Recontacté par le gestionnaire': z.enum(['Oui', 'Non', '']),

    // Communication
    comment_fcu: z.string(),
  })
  .partial();

export type UpdateAdminDemandInput = z.infer<typeof zAdminDemandUpdateValues>;

export type UpdateDemandInput = UpdateGestionnaireDemandInput & UpdateAdminDemandInput;

export const zGestionnaireUpdateDemandInput = z.object({
  demandId: z.string(),
  values: zGestionnaireDemandUpdateValues,
});

export const zAdminUpdateDemandInput = z.object({
  demandId: z.string(),
  values: zAdminDemandUpdateValues,
});

export const zCreateDemandInput = z.object({
  address: z.string().trim(),
  city: z.string(),
  company: z.string().optional().default(''),
  companyType: z.string().optional().default(''),
  coords: z.object({
    lat: z.number(),
    lon: z.number(),
  }),
  demandArea: z.number().optional(),
  demandCompanyName: z.string().optional().default(''),
  demandCompanyType: z.string().optional().default(''),
  department: z.string(),
  eligibility: z.object({
    distance: z.number().nullable(),
    inPDP: z.boolean(),
    isEligible: z.boolean(),
  }),
  email: z.string().trim(),
  firstName: z.string(),
  heatingEnergy: z.string(),
  heatingType: z.string().optional(),
  lastName: z.string(),
  mtm_campaign: z.string().optional(),
  mtm_kwd: z.string().optional(),
  mtm_source: z.string().optional(),
  nbLogements: z.number().optional(),
  // Tracking de conversion (module conversion-tracking) : source (niveau 1) + page + host embarquant (iframes)
  origin_host: z.string().optional(),
  origin_page: z.string().optional(),
  origin_source: z.string().optional(),
  phone: z.string().optional().default(''),
  postcode: z.string(),
  region: z.string(),
  structure: z.string(),
  termOfUse: z.boolean(),
});

export const modesDeChauffage = [
  { id: 'electricite', label: 'Électricité', value: 'électricité' },
  { id: 'gaz', label: 'Gaz', value: 'gaz' },
  { id: 'fioul', label: 'Fioul', value: 'fioul' },
  { id: 'autre', label: 'Autre / Je ne sais pas', value: 'autre' },
] as const;
export type ModeDeChauffage = (typeof modesDeChauffage)[number]['value'];

export const typesDeChauffage = [
  { id: 'individuel', label: 'Individuel', value: 'individuel' },
  { id: 'collectif', label: 'Collectif', value: 'collectif' },
] as const;
export type TypeDeChauffage = (typeof typesDeChauffage)[number]['value'];

/** Canonical labels stored in legacy_values "Mode de chauffage" (DB + partner API). */
export const modesDeChauffageLabels = nonEmptyArray(modesDeChauffage.map(({ label }) => label));
export type ModeDeChauffageLabel = (typeof modesDeChauffageLabels)[number];

/** Canonical labels stored in legacy_values "Type de chauffage" (DB + partner API) — includes the fallback label. */
export const typesDeChauffageLabels = nonEmptyArray([...typesDeChauffage.map(({ label }) => label), 'Autre / Je ne sais pas' as const]);
export type TypeDeChauffageLabel = (typeof typesDeChauffageLabels)[number];

/** Canonical values stored in legacy_values "Structure" (see formatStructureToAirtable). */
export const availableStructures = ['Tertiaire', 'Copropriété', 'Bailleur social', 'Maison individuelle', 'Autre'] as const;

export const fieldLabelInformation = {
  company: 'Nom de votre structure',
  companyTitle: 'Votre structure',
  companyType: {
    inputs: [
      { id: 'syndic', label: 'Syndic de copropriété', value: 'Syndic de copropriété' },
      { id: 'bailleur', label: 'Bailleur social', value: 'Bailleur social' },
      { id: 'gestionnaire', label: 'Gestionnaire de parc tertiaire', value: 'Gestionnaire de parc tertiaire' },
      { id: 'bureau', label: "Bureau d'études ou AMO", value: "Bureau d'études ou AMO" },
      { id: 'mandataire', label: 'Mandataire / délégataire CEE', value: 'Mandataire / délégataire CEE' },
    ] as const,
    label: 'Type de structure',
  },
  contactDetailsTitle: 'Vos coordonnées',
  demandArea: 'Surface en m2',
  demandCompanyName: 'Nom de la structure accompagnée',
  demandCompanyType: {
    inputs: [
      { id: 'copro', label: 'une copropriété', value: 'Copropriété' },
      { id: 'maison', label: 'une maison individuelle', value: 'Maison individuelle' },
      { id: 'batiment', label: 'un bâtiment tertiaire', value: 'Bâtiment tertiaire' },
      { id: 'bailleur', label: 'du logement social', value: 'Bailleur social' },
      { id: 'autre', label: 'autre', value: 'Autre' },
    ],
    label: 'Votre demande concerne',
  },
  email: 'Email',
  firstName: 'Prénom',
  heatingEnergy: {
    inputs: modesDeChauffage,
    label: 'Votre énergie de chauffage',
  },
  lastName: 'Nom',
  nbLogements: 'Nombre de logements',
  phone: 'Téléphone',
  structure: {
    inputs: [
      { id: 'copropriete', label: 'Copropriétaire', value: 'Copropriété' },
      {
        id: 'maison',
        label: 'Propriétaire de maison individuelle',
        value: 'Maison individuelle',
      },
      { id: 'tertiaire', label: 'Professionnel', value: 'Tertiaire' },
    ] satisfies { id: string; label: string; value: (typeof availableStructures)[number] }[],
    label: 'Vous êtes...',
  },
};

/** companyType values offered when structure = Tertiaire, source of truth for the union type. */
export type DemandCompanyType = (typeof fieldLabelInformation.companyType.inputs)[number]['value'];

const demandContactShape = {
  company: z.string().optional().default(''),
  companyType: z.string().optional().default(''),
  demandArea: z.number().optional(),
  demandCompanyName: z.string().optional().default(''),
  demandCompanyType: z.string().optional().default(''),
  email: z.email("Votre adresse email n'est pas valide").min(1, 'Veuillez renseigner votre adresse email'),
  firstName: z.string().min(1, 'Veuillez renseigner votre prénom'),
  lastName: z.string().min(1, 'Veuillez renseigner votre nom'),
  nbLogements: z.number().optional(),
  phone: z
    .string()
    .regex(/^(?:(?:\+|00)33|0)\s*[1-9]\d{8}$|^$/, 'Veuillez renseigner votre numéro de téléphone sous le format 0605040302')
    .optional()
    .default(''),
  structure: z.string().min(1, 'Veuillez renseigner votre type de bâtiment'),
} satisfies z.ZodRawShape;

const validateDemandContactInfo = (
  {
    company,
    companyType,
    demandCompanyName,
    demandCompanyType,
    structure,
  }: {
    company?: string;
    companyType?: string;
    demandCompanyName?: string;
    demandCompanyType?: string;
    structure: string;
  },
  ctx: z.RefinementCtx
) => {
  const displayIssue = (field: string, message: string) => {
    console.error(field, message);
    ctx.addIssue({
      code: 'custom',
      message,
      path: [field],
    });
  };

  if (structure === 'Tertiaire' && !companyType) {
    displayIssue('companyType', 'Veuillez sélectionner le type de votre structure');
  }
  if (structure === 'Tertiaire' && !company) {
    displayIssue('company', 'Veuillez renseigner le nom de votre structure');
  }
  if (
    structure === 'Tertiaire' &&
    (companyType === "Bureau d'études ou AMO" || companyType === 'Mandataire / délégataire CEE') &&
    !demandCompanyType
  ) {
    displayIssue('demandCompanyType', 'Veuillez sélectionner le type de la structure accompagnée');
  }
  if (
    structure === 'Tertiaire' &&
    (companyType === "Bureau d'études ou AMO" || companyType === 'Mandataire / délégataire CEE') &&
    (demandCompanyType === 'Bâtiment tertiaire' || demandCompanyType === 'Bailleur social' || demandCompanyType === 'Autre') &&
    !demandCompanyName
  ) {
    displayIssue('demandCompanyName', 'Veuillez renseigner le nom de la structure accompagnée');
  }
};

export const zBatchDemandContactSchema = z.object(demandContactShape).superRefine(validateDemandContactInfo);

export const zContactFormCreateDemandInput = z
  .object({
    ...demandContactShape,
    heatingEnergy: z
      .string()
      .refine(
        (val) => fieldLabelInformation.heatingEnergy.inputs.some((input) => input.value === val),
        'Veuillez sélectionner une énergie de chauffage'
      ),
    heatingType: z.string().optional(),
    termOfUse: z.boolean().refine((val) => val, {
      error: 'Ce champ est requis',
    }),
  })
  .superRefine(validateDemandContactInfo);

export type ContactFormInfos = z.infer<typeof zContactFormCreateDemandInput>;
export type BatchDemandContactInfo = z.infer<typeof zBatchDemandContactSchema>;

export type CreateDemandInput = z.infer<typeof zCreateDemandInput>;

/**
 * Résultat renvoyé au front après tentative de dépôt d'une demande (affiché par DemandSubmittedPanel).
 * `isExisting` = true quand une demande identique (même email + adresse) existait déjà dans
 * les 30 derniers jours : aucune nouvelle demande n'a été créée, on renvoie l'existante.
 */
export type DemandSubmissionResult = {
  id: string;
  isExisting: boolean;
  address: string;
  createdAt: string;
  status: DemandStatus;
  isEligible: boolean;
  networkName: string | null;
  distance: number | null;
  email: string;
};

// Batch demand creation schemas
export const zBatchDemandStep1Schema = z
  .object({
    ...demandContactShape,
    termOfUse: z.boolean().refine((val) => val, 'Vous devez accepter les conditions'),
  })
  .superRefine(validateDemandContactInfo);

export type BatchDemandStep1Data = z.infer<typeof zBatchDemandStep1Schema>;

export const zBatchDemandAddressSchema = z.object({
  addressId: z.string().min(1),
  heatingEnergy: z.enum(nonEmptyArray(modesDeChauffage.map(({ value }) => value)), {
    message: 'Veuillez sélectionner une énergie de chauffage',
  }),
  heatingType: z.enum(nonEmptyArray(typesDeChauffage.map(({ value }) => value)), {
    message: 'Veuillez sélectionner un type de chauffage',
  }),
});

export type BatchDemandAddressData = z.infer<typeof zBatchDemandAddressSchema>;

export const zCreateBatchDemandInput = z.object({
  addresses: z
    .array(zBatchDemandAddressSchema)
    .min(1, 'Au moins une adresse doit être sélectionnée')
    .max(50, 'Maximum 50 adresses par demande'),
  contact: zBatchDemandContactSchema.optional(),
  termOfUse: z.boolean().refine((val) => val, 'Vous devez accepter les conditions'),
});

export type CreateBatchDemandInput = z.infer<typeof zCreateBatchDemandInput>;

/************* Normalisation des valeurs legacy *************/

/**
 * Normalise une valeur de mode de chauffage (heatingEnergy) vers le label standard.
 * Gère les inconsistances : casse, accents, espaces, valeurs legacy.
 */
export const normalizeHeatingEnergy = (value: string | null | undefined): ModeDeChauffageLabel | null => {
  if (!value) return null;

  const normalized = value.toLowerCase().trim();

  if (['électricité', 'electricite', 'electricité'].includes(normalized)) {
    return 'Électricité';
  }
  if (normalized === 'gaz') {
    return 'Gaz';
  }
  if (normalized === 'fioul') {
    return 'Fioul';
  }
  if (['autre', 'autre / je ne sais pas'].includes(normalized)) {
    return 'Autre / Je ne sais pas';
  }

  return null; // Valeur non reconnue
};

/**
 * Normalise une valeur de type de chauffage (heatingType) vers le label standard.
 * Gère les inconsistances : casse, valeurs legacy.
 */
export const normalizeHeatingType = (value: string | null | undefined): TypeDeChauffageLabel | null => {
  if (!value) return null;

  const normalized = value.toLowerCase().trim();

  if (normalized === 'collectif') {
    return 'Collectif';
  }
  if (normalized === 'individuel') {
    return 'Individuel';
  }
  if (['autre', 'autre / je ne sais pas'].includes(normalized)) {
    return 'Autre / Je ne sais pas';
  }

  // Valeur incorrecte dans le mauvais champ (ex: "électricité" dans Type de chauffage)
  if (['électricité', 'electricite', 'electricité', 'gaz', 'fioul'].includes(normalized)) {
    return null;
  }

  return null; // Valeur non reconnue
};

/************* Airtable Legacy *************/

const formatHeatingEnergyToAirtable = (heatingEnergy: string): ModeDeChauffageLabel => {
  switch (heatingEnergy) {
    case 'électricité':
      return 'Électricité';
    case 'gaz':
      return 'Gaz';
    case 'fioul':
      return 'Fioul';
    default:
      return 'Autre / Je ne sais pas';
  }
};
export const formatHeatingTypeToAirtable = (heatingType?: string): TypeDeChauffageLabel => {
  switch (heatingType) {
    case 'individuel':
      return 'Individuel';
    case 'collectif':
      return 'Collectif';
    default:
      return 'Autre / Je ne sais pas';
  }
};
const formatStructureToAirtable: (structure: string, companyType?: string, demandCompanyType?: string) => string = (
  structure,
  companyType,
  demandCompanyType
) => {
  if (structure === 'Tertiaire') {
    switch (companyType) {
      case 'Bailleur social':
        return companyType;
      case 'Syndic de copropriété':
        return 'Copropriété';
      case "Bureau d'études ou AMO":
      case 'Mandataire / délégataire CEE':
        switch (demandCompanyType) {
          case 'Copropriété':
          case 'Maison individuelle':
          case 'Bailleur social':
          case 'Autre':
            return demandCompanyType;
          default:
            return structure;
        }
      default:
        return structure;
    }
  }
  return structure;
};
const formatEtablissementToAirtable: (
  structure: string,
  company: string,
  companyType?: string,
  demandCompanyType?: string,
  demandCompanyName?: string
) => string = (structure, company, companyType, demandCompanyType, demandCompanyName) => {
  if (structure === 'Tertiaire' && (companyType === "Bureau d'études ou AMO" || companyType === 'Mandataire / délégataire CEE')) {
    if (demandCompanyType === 'Bâtiment tertiaire' || demandCompanyType === 'Bailleur social' || demandCompanyType === 'Autre') {
      return demandCompanyName || '';
    }
    return '';
  } else if (structure === 'Tertiaire' && companyType === 'Syndic de copropriété') {
    return '';
  }
  return company;
};
const formatNomStructureAccompagnanteToAirtable: (structure: string, company: string, companyType?: string) => string = (
  structure,
  company,
  companyType
) => {
  if (
    structure === 'Tertiaire' &&
    (companyType === "Bureau d'études ou AMO" || companyType === 'Mandataire / délégataire CEE' || companyType === 'Syndic de copropriété')
  ) {
    return company || '';
  }
  return '';
};

export const formatDataToLegacyAirtable = (values: CreateDemandInput) => {
  const {
    address,
    coords,
    eligibility,
    heatingEnergy,
    heatingType,
    structure,
    firstName,
    lastName,
    company,
    companyType,
    email,
    city,
    postcode,
    department,
    region,
    phone,
    demandCompanyType,
    demandCompanyName,
    mtm_campaign,
    mtm_kwd,
    mtm_source,
    demandArea,
    nbLogements,
  } = values;

  return {
    Adresse: address,
    'Campagne keywords': mtm_kwd,
    'Campagne matomo': mtm_campaign,
    'Campagne source': mtm_source,
    'Code Postal': postcode,
    Departement: department,
    'Distance au réseau': eligibility?.distance,
    'en PDP': eligibility.inPDP ? 'Oui' : 'Non',
    Latitude: coords.lat,
    Logement: nbLogements,
    Longitude: coords.lon,
    Mail: email,
    'Mode de chauffage': formatHeatingEnergyToAirtable(heatingEnergy),
    Nom: lastName,
    'Nom de la structure accompagnante': formatNomStructureAccompagnanteToAirtable(structure, company, companyType),
    Prénom: firstName,
    Region: region,
    Structure: formatStructureToAirtable(structure, companyType, demandCompanyType),
    'Structure accompagnante':
      structure === 'Tertiaire' &&
      (companyType === "Bureau d'études ou AMO" ||
        companyType === 'Mandataire / délégataire CEE' ||
        companyType === 'Syndic de copropriété')
        ? companyType
        : undefined,
    'Surface en m2': demandArea,
    'Type de chauffage': formatHeatingTypeToAirtable(heatingType),
    Téléphone: phone,
    Ville: city,
    Éligibilité: eligibility.isEligible,
    Établissement: formatEtablissementToAirtable(structure, company, companyType, demandCompanyType, demandCompanyName),
  };
};

/**
 * Type d'un cas d'éligibilité
 */
export type EligibilityCase = {
  type: EligibilityType;
  title: string;
  description: string;
};

/**
 * Liste de tous les cas d'éligibilité possibles avec leurs descriptions
 */
export const eligibilityTypes = [
  {
    description: "L'adresse se trouve dans un Périmètre de Développement Prioritaire (PDP) où un réseau de chaleur existe.",
    title: 'Dans un PDP réseau existant',
    type: 'dans_pdp_reseau_existant',
  },
  {
    description: "L'adresse se trouve dans un Périmètre de Développement Prioritaire (PDP) où un réseau de chaleur est prévu.",
    title: 'Dans un PDP réseau futur',
    type: 'dans_pdp_reseau_futur',
  },
  {
    description: "Un réseau de chaleur existant se trouve à moins de 100m (60m sur Paris) de l'adresse.",
    title: 'Réseau existant très proche',
    type: 'reseau_existant_tres_proche',
  },
  {
    description: "Un réseau de chaleur en construction se trouve à moins de 100m (60m sur Paris) de l'adresse.",
    title: 'Réseau futur très proche',
    type: 'reseau_futur_tres_proche',
  },
  {
    description: "L'adresse se trouve dans une zone où un réseau de chaleur est en cours de construction.",
    title: 'Dans une zone de réseau futur',
    type: 'dans_zone_reseau_futur',
  },
  {
    description: "Un réseau de chaleur existant se trouve entre 100 et 200m (60 et 100m sur Paris) de l'adresse.",
    title: 'Réseau existant proche',
    type: 'reseau_existant_proche',
  },
  {
    description: "Un réseau de chaleur en construction se trouve entre 100 et 200m (60 et 100m sur Paris) de l'adresse.",
    title: 'Réseau futur proche',
    type: 'reseau_futur_proche',
  },
  {
    description: "Un réseau de chaleur existant se trouve entre 200 et 1000m de l'adresse.",
    title: 'Réseau existant éloigné',
    type: 'reseau_existant_loin',
  },
  {
    description: "Un réseau de chaleur en construction se trouve entre 200 et 1000m de l'adresse.",
    title: 'Réseau futur éloigné',
    type: 'reseau_futur_loin',
  },
  {
    description: "L'adresse se trouve dans une ville où un réseau de chaleur existe mais dont le tracé n'est pas disponible.",
    title: 'Dans une ville avec réseau existant sans tracé',
    type: 'dans_ville_reseau_existant_sans_trace',
  },
  {
    description: "Aucun réseau de chaleur (existant ou en construction) ne se trouve à moins de 1000m de l'adresse.",
    title: 'Trop éloigné',
    type: 'trop_eloigne',
  },
] as const satisfies EligibilityCase[];

/**
 * Map des types d'éligibilité vers leur titre
 */
export const eligibilityTitleByType = eligibilityTypes.reduce(
  (acc, eligibilityCase) => {
    acc[eligibilityCase.type] = eligibilityCase.title;
    return acc;
  },
  {} as Record<EligibilityType, string>
);

// Ensure all eligibility types are covered
type MissingEligibilityTypes = Exclude<EligibilityType, ExtractKeys<typeof eligibilityTypes, 'type'>>;
type AssertAllEligibilityTypesPresent = MissingEligibilityTypes extends never ? true : never;
const _eligibilityCheck: AssertAllEligibilityTypesPresent = true;
