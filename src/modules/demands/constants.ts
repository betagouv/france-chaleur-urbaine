import { z } from 'zod';

export const zAddRelanceCommentInput = z.object({
  comment: z.string().min(1, 'Le commentaire est requis'),
  relanceId: z.string(),
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
    Commentaire: z.string().nullable(),

    // Additional info
    'Gestionnaire Conso': z.number().nullable(),
    'Gestionnaire Logement': z.number().nullable(),
    'Surface en m2': z.number().nullable(),
  })
  .partial();

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
    Commentaires_internes_FCU: z.string(),
  })
  .partial();

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
    distance: z.number(),
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
