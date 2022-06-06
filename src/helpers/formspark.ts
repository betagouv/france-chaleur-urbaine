export const formatDataToFormspark: (
  values: Record<string, any>
) => Record<string, any> = (values) => {
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
  } = values;

  const formatedData = {
    Nom: lastName || '',
    Prénom: firstName || '',
    Établissement: company || '',
    Email: email || '',
    Structure: structure || '',
    Chauffage: `${heatingEnergy} - ${heatingType}`,
    Adresse: {
      coords: [coords.lat, coords.lon],
      label: address || '',
    },
    'Distance au réseau': network?.distance
      ? `${network.distance}m`
      : 'inconnue',
    Éligiblité: eligibility,
    'Accord pour la collecte des données': true,
    'Accord pour partage au gestionnaire': true,
  };

  return formatedData;
};
