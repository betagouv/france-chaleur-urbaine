import { z } from 'zod';

import type { EligibilityType } from '@/server/services/addresseInformation';
import type { ExtractKeys } from '@/utils/typescript';

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

const zUserDemandUpdateValues = z
  .object({
    Sondage: z.array(z.string()).nullable(),
  })
  .partial();

// Zod schema for demand update values - only fields actually used in updateDemand calls
// Analysis based on all updateDemand usage across the codebase
const zGestionnaireDemandUpdateValues = z
  // biome-ignore assist/source/useSortedKeys: keep field order for clarity and maintainability
  .object({
    // Tags & Assignment
    'Gestionnaire Affecté à': z.string(),

    // Network info
    'Gestionnaire Distance au réseau': z.number().nullable(),

    // Status & Contact
    Status: z.string(), // DemandStatus | ''
    'Prise de contact': z.boolean(),

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
    // Tags & Assignment
    Gestionnaires: z.union([z.string(), z.array(z.string()), z.null()]),
    'Affecté à': z.union([z.string(), z.array(z.string()), z.null()]),
    'Gestionnaires validés': z.boolean(),

    // Network info
    'Distance au réseau': z.number().nullable(),
    'Identifiant réseau': z.string().nullable(),
    'Nom réseau': z.string().nullable(),

    // Status & Contact
    'Relance à activer': z.boolean(),

    // Communication
    comment_fcu: z.string(),
  })
  .partial();

export type UpdateAdminDemandInput = z.infer<typeof zAdminDemandUpdateValues>;

export type UpdateDemandInput = UpdateGestionnaireDemandInput & UpdateAdminDemandInput & UpdateAdminDemandInput;

export const zUserUpdateDemandInput = z.object({
  demandId: z.string(),
  values: zUserDemandUpdateValues,
});

export const zGestionnaireUpdateDemandInput = z.object({
  demandId: z.string(),
  values: zGestionnaireDemandUpdateValues,
});

export const zAdminUpdateDemandInput = z.object({
  demandId: z.string(),
  values: zAdminDemandUpdateValues,
});

export const zCreateDemandInput = z.object({
  address: z.string(),
  city: z.string(),
  company: z.string(),
  companyType: z.string(),
  coords: z.object({
    lat: z.number(),
    lon: z.number(),
  }),
  demandArea: z.number().optional(),
  demandCompanyName: z.string(),
  demandCompanyType: z.string(),
  department: z.string(),
  eligibility: z.object({
    distance: z.number().nullable(),
    inPDP: z.boolean(),
    isEligible: z.boolean(),
  }),
  email: z.string(),
  firstName: z.string(),
  heatingEnergy: z.string(),
  heatingType: z.string(),
  lastName: z.string(),
  mtm_campaign: z.string().optional(),
  mtm_kwd: z.string().optional(),
  mtm_source: z.string().optional(),
  nbLogements: z.number().optional(),
  networkId: z.string().optional(),
  phone: z.string(),
  postcode: z.string(),
  region: z.string(),
  structure: z.string(),
  termOfUse: z.boolean(),
});

export type CreateDemandInput = z.infer<typeof zCreateDemandInput>;

export const demandStatuses = [
  { label: 'En attente de prise en charge', value: 'empty' },
  { label: 'Non réalisable', value: 'unrealisable' },
  { label: 'En attente d’éléments du prospect', value: 'waiting' },
  { label: 'Étude en cours', value: 'in_progress' },
  { label: 'Voté en AG', value: 'voted' },
  { label: 'Travaux en cours', value: 'work_in_progress' },
  { label: 'Réalisé', value: 'done' },
  { label: 'Projet abandonné par le prospect', value: 'abandoned' },
] as const;

export const demandStatusDefault = demandStatuses[0].label;

export type DemandStatus = (typeof demandStatuses)[number]['label'];

export const referrers = [
  { label: 'Moteur de recherche' },
  { label: 'Pub web' },
  { label: 'Article' },
  { label: 'Pub télé' },
  { label: "Bureau d'étude" },
  { label: 'Espace France Rénov’' },
  { label: 'Bouche à oreille' },
  { label: 'Services municipaux' },
  { label: 'Webinaire' },
  { label: 'Autre' },
] as const;

export type Referrer = (typeof referrers)[number]['label'];

/************* Airtable Legacy *************/

const formatHeatingEnergyToAirtable = (heatingEnergy: string) => {
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
export const formatHeatingTypeToAirtable = (heatingType?: string) => {
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
    networkId,
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
    networkId,
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
    description:
      "Un réseau de chaleur existant se trouve entre 200 et 1000m de l'adresse. Les tags gestionnaires sont automatiquement ajoutés si la distance est inférieure à 500m.",
    title: 'Réseau existant éloigné',
    type: 'reseau_existant_loin',
  },
  {
    description:
      "Un réseau de chaleur en construction se trouve entre 200 et 1000m de l'adresse. Les tags gestionnaires sont automatiquement ajoutés si la distance est inférieure à 500m.",
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
