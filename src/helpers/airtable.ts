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
    eligibility,
    heatingEnergy,
    heatingType,
    network,
    structure,
    firstName,
    lastName,
    company,
    email,
    dataRetention,
    dataSharing,
  } = values;

  return {
    Nom: lastName,
    Prénom: firstName,
    Structure: structure,
    Établissement: company,
    Éligibilité: eligibility,
    Adresse: address,
    Mail: email,
    'Mode de chauffage': formatHeatingEnergyToAirtable(heatingEnergy),
    'Type de chauffage': formatHeatingTypeToAirtable(heatingType),
    'Distance au réseau': network?.distance,
    'Choix en fonction de la distance au réseau':
      formatDistanceToAirtable(network?.distance, heatingType) || 'inconnue',
    'J’accepte que les données collectées soient utilisées à des fins d’analyse par le ministère de la transition écologique.':
      dataRetention,
    'J’accepte que ma demande soit communiquée à ma commune et au gestionnaire du réseau le plus proche (sans aucun engagement de ma part)':
      dataSharing,
  };
};

const submitToAirtable: (values: any, type: string) => void = async (
  values,
  type
): Promise<Response | void> => {
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
