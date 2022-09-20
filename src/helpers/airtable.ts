const formatDistanceToAirtable: (
  distance?: number,
  heatingType?: string
) => string | false = (distance, heatingType) => {
  if (!distance || !heatingType) return false;

  const enableValue = [
    '< 100m, collectif',
    '< 100m, individuel',
    '> 100m et < 200m, collectif',
    '> 100m et < 200m, individuel',
    '> 200m, collectif',
    '> 200m, individuel',
  ];

  const distStep =
    distance <= 100
      ? '< 100m'
      : distance <= 200
      ? '> 100m et < 200m'
      : '> 200m';
  const formatedDistance = `${distStep}, ${heatingType}`;
  return !enableValue.includes(formatedDistance) && formatedDistance;
};

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

export const formatDataToAirtable: (values: any) => Record<string, any> = (
  values
) => {
  const {
    address,
    coords,
    eligibility,
    heatingEnergy,
    heatingType,
    network,
    structure,
    firstName,
    lastName,
    company,
    email,
    termOfUse,
    inZDP,
    city,
    postcode,
  } = values;

  return {
    Nom: lastName,
    Prénom: firstName,
    Structure: structure,
    Établissement: company,
    Éligibilité: eligibility,
    Adresse: address,
    Latitude: parseFloat(coords.lat),
    Longitude: parseFloat(coords.lon),
    Mail: email,
    'Mode de chauffage': formatHeatingEnergyToAirtable(heatingEnergy),
    'Type de chauffage': formatHeatingTypeToAirtable(heatingType),
    'Distance au réseau': network?.distance,
    'en ZDP': inZDP ? 'Oui' : 'Non',
    'Choix en fonction de la distance au réseau':
      formatDistanceToAirtable(network?.distance, heatingType) || 'inconnue',
    'J’accepte les CGU': termOfUse,
    Ville: city,
    'Code Postal': postcode,
  };
};

const submitToAirtable = async (
  values: any,
  type: string
): Promise<Response> => {
  const airTableUrl = './api/airtable/create-record';
  return fetch(airTableUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...values, type }),
  });
};

export default submitToAirtable;
