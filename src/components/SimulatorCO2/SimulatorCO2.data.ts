export const dataSimulator: { [key: string]: any } = {
  copropriete: {
    chapo:
      'Estimez les émissions de CO2 évitées par le raccordement de votre copropriété à un réseau de chaleur*',
    label: {
      conso: 'Consommation (MWh/an)',
      surf: 'Surface (m²)**',
      log: 'Nombre de logements***',
      chauffage: 'Chauffage actuel',
    },
    annotation: [
      '* Raccordement à un réseau de chaleur alimenté à 60% par des énergies renouvelables',
      '**Logement moyen consommant 140 kWh/m2/an',
      '*** Logement moyen de 70 m2 consommant 10MWh/an',
    ],
    styleInline: false,
  },
  tertiaire: {
    chapo:
      'Estimez les émissions de CO2 évitées par le raccordement de vos locaux à un réseau de chaleur*',
    label: {
      conso: 'Consommation (MWh/an)',
      surf: 'Surface (m²)',
      chauffage: 'Chauffage actuel',
    },
    annotation: [
      '*Bâtiment tertiaire construit entre 2005 et 2012, consommant 78kWhu/m2/an pour son chauffage et se raccordant à un réseau de chaleur alimenté à 60% par des énergies renouvelables',
    ],
    styleInline: true,
  },
};
