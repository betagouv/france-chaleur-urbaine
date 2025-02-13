export const modesDeChauffage = [
  {
    label: 'Réseau de chaleur',
    emissionsCO2PublicodesKey: 'Réseaux de chaleur x Collectif',
    coutPublicodeKey: 'Réseaux de chaleur',
    reversible: false,
    tertiaire: true,
  },
  {
    label: 'Chaudière à granulés collective',
    emissionsCO2PublicodesKey: 'Chaudière à granulés coll x Collectif',
    coutPublicodeKey: 'Chaudière à granulés coll',
    reversible: false,
    tertiaire: true,
  },
  {
    label: 'Gaz à condensation collectif',
    emissionsCO2PublicodesKey: 'Gaz coll avec cond x Collectif',
    coutPublicodeKey: 'Gaz coll avec cond',
    reversible: false,
    tertiaire: true,
  },
  {
    label: 'Gaz sans condensation collectif',
    emissionsCO2PublicodesKey: 'Gaz coll sans cond x Collectif',
    coutPublicodeKey: 'Gaz coll sans cond',
    reversible: false,
    tertiaire: true,
  },
  {
    label: 'Fioul collectif',
    emissionsCO2PublicodesKey: 'Fioul coll x Collectif',
    coutPublicodeKey: 'Fioul coll',
    reversible: false,
    tertiaire: true,
  },
  {
    label: 'PAC air/air collective',
    emissionsCO2PublicodesKey: 'PAC air-air x Collectif',
    coutPublicodeKey: 'PAC air-air coll',
    reversible: true,
    tertiaire: true,
  },
  {
    label: 'PAC air/eau collective',
    emissionsCO2PublicodesKey: 'PAC air-eau x Collectif',
    coutPublicodeKey: 'PAC air-eau coll',
    reversible: true,
    tertiaire: true,
  },
  {
    label: 'PAC eau/eau collective',
    emissionsCO2PublicodesKey: 'PAC eau-eau x Collectif',
    coutPublicodeKey: 'PAC eau-eau coll',
    reversible: false,
    tertiaire: true,
  },
  {
    label: 'Poêle à granulés individuel',
    emissionsCO2PublicodesKey: 'Poêle à granulés indiv x Individuel',
    coutPublicodeKey: 'Poêle à granulés indiv',
    reversible: false,
    tertiaire: false,
  },
  {
    label: 'Gaz à condensation individuel',
    emissionsCO2PublicodesKey: 'Gaz indiv avec cond x Individuel',
    coutPublicodeKey: 'Gaz indiv avec cond',
    reversible: false,
    tertiaire: false,
  },
  {
    label: 'Gaz sans condensation individuel',
    emissionsCO2PublicodesKey: 'Gaz indiv sans cond x Individuel',
    coutPublicodeKey: 'Gaz indiv sans cond',
    reversible: false,
    tertiaire: false,
  },

  {
    label: 'Fioul individuel',
    emissionsCO2PublicodesKey: 'Fioul indiv x Individuel',
    coutPublicodeKey: 'Fioul indiv',
    reversible: false,
    tertiaire: false,
  },

  {
    label: 'PAC air/air individuelle',
    emissionsCO2PublicodesKey: 'PAC air-air x Individuel',
    coutPublicodeKey: 'PAC air-air indiv',
    reversible: true,
    tertiaire: false,
  },

  {
    label: 'PAC air/eau individuelle',
    emissionsCO2PublicodesKey: 'PAC air-eau x Individuel',
    coutPublicodeKey: 'PAC air-eau indiv',
    reversible: true,
    tertiaire: false,
  },

  {
    label: 'PAC eau/eau individuelle',
    emissionsCO2PublicodesKey: 'PAC eau-eau x Individuel',
    coutPublicodeKey: 'PAC eau-eau indiv',
    reversible: false,
    tertiaire: false,
  },

  {
    label: 'Radiateur électrique individuel',
    emissionsCO2PublicodesKey: 'Radiateur électrique x Individuel',
    coutPublicodeKey: 'Radiateur électrique',
    reversible: false,
    tertiaire: true,
  },
] as const;

export type ModeDeChauffage = (typeof modesDeChauffage)[number]['label'];
