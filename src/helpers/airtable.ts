import { Airtable } from 'src/types/enum/Airtable';
import { AirtableDemandCreation, FormDemandCreation } from 'src/types/Summary/Demand';

const formatHeatingEnergyToAirtable: (heatingEnergy: string) => string = (heatingEnergy) => {
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
const formatHeatingTypeToAirtable: (heatingType?: string) => string = (heatingType) => {
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
        return 'Logement social';
      case 'Syndic de copropriété':
        return 'Copropriété';
      case "Bureau d'études ou AMO":
      case 'Mandataire / délégataire CEE':
        switch (demandCompanyType) {
          case 'Copropriété':
          case 'Maison individuelle':
          case 'Autre':
            return demandCompanyType;
          case 'Bailleur social':
            return 'Logement social';
          default:
            return structure;
        }
        break;
      default:
        return structure;
    }
  }
  return structure;
};
const formatEtablissementToAirtable: (structure: string, company: string, companyType?: string, demandCompanyName?: string) => string = (
  structure,
  company,
  companyType,
  demandCompanyName
) => {
  if (structure === 'Tertiaire' && (companyType === "Bureau d'études ou AMO" || companyType === 'Mandataire / délégataire CEE')) {
    return demandCompanyName || '';
  }
  return company;
};

export const formatDataToAirtable: (values: FormDemandCreation) => AirtableDemandCreation = (values) => {
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
    Nom: lastName,
    Prénom: firstName,
    Structure: formatStructureToAirtable(structure, companyType, demandCompanyType),
    Établissement: formatEtablissementToAirtable(structure, company, companyType, demandCompanyName),
    'Structure accompagnante':
      structure === 'Tertiaire' &&
      (companyType === "Bureau d'études ou AMO" ||
        companyType === 'Mandataire / délégataire CEE' ||
        companyType === 'Syndic de copropriété')
        ? companyType
        : '',
    Éligibilité: eligibility.isEligible,
    Adresse: address,
    Latitude: coords.lat,
    Longitude: coords.lon,
    Mail: email,
    Téléphone: phone,
    'Mode de chauffage': formatHeatingEnergyToAirtable(heatingEnergy),
    'Type de chauffage': formatHeatingTypeToAirtable(heatingType),
    'Distance au réseau': eligibility?.distance,
    'en PDP': eligibility.inPDP ? 'Oui' : 'Non',
    Ville: city,
    'Code Postal': postcode,
    Departement: department,
    Region: region,
    'Campagne matomo': mtm_campaign,
    'Campagne keywords': mtm_kwd,
    'Campagne source': mtm_source,
    'Nom de la structure accompagnante':
      structure === 'Tertiaire' && (companyType === "Bureau d'études ou AMO" || companyType === 'Mandataire / délégataire CEE')
        ? company
        : '',
    'Surface en m2': demandArea || undefined,
    Logement: nbLogements || undefined,
    networkId,
  };
};

export const submitToAirtable = async (values: any, type: Airtable): Promise<Response> => {
  const res = await fetch('/api/airtable/records', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...values, type }),
  });
  if (!res.ok) {
    throw new Error(`wrong status ${res.status}`);
  }
  return res;
};

export const updateAirtable = async (recordId: string, values: any, type: string): Promise<Response> => {
  return fetch(`./api/airtable/records/${recordId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...values, type }),
  });
};
