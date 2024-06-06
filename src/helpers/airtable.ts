import {
  AirtableDemandCreation,
  FormDemandCreation,
} from 'src/types/Summary/Demand';
import { Airtable } from 'src/types/enum/Airtable';

const formatHeatingEnergyToAirtable: (heatingEnergy: string) => string = (
  heatingEnergy
) => {
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
const formatHeatingTypeToAirtable: (heatingType?: string) => string = (
  heatingType
) => {
  switch (heatingType) {
    case 'individuel':
      return 'Individuel';
    case 'collectif':
      return 'Collectif';
    default:
      return 'Autre / Je ne sais pas';
  }
};

export const formatDataToAirtable: (
  values: FormDemandCreation
) => AirtableDemandCreation = (values) => {
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
    email,
    city,
    postcode,
    department,
    region,
    phone,
    mtm_campaign,
    mtm_kwd,
    mtm_source,
    networkId,
  } = values;

  return {
    Nom: lastName,
    Prénom: firstName,
    Structure: structure,
    Établissement: company,
    Éligibilité: eligibility.isEligible,
    Adresse: address,
    Latitude: coords.lat,
    Longitude: coords.lon,
    Mail: email,
    Téléphone: phone,
    'Mode de chauffage': formatHeatingEnergyToAirtable(heatingEnergy),
    'Type de chauffage': formatHeatingTypeToAirtable(heatingType),
    'Distance au réseau': eligibility?.distance,
    'en ZDP': eligibility.inZDP ? 'Oui' : 'Non',
    Ville: city,
    'Code Postal': postcode,
    Departement: department,
    Region: region,
    'Campagne matomo': mtm_campaign,
    'Campagne keywords': mtm_kwd,
    'Campagne source': mtm_source,
    networkId,
  };
};

export const submitToAirtable = async (
  values: any,
  type: Airtable
): Promise<Response> => {
  return fetch('/api/airtable/records', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...values, type }),
  });
};

export const updateAirtable = async (
  recordId: string,
  values: any,
  type: string
): Promise<Response> => {
  return fetch(`./api/airtable/records/${recordId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...values, type }),
  });
};
