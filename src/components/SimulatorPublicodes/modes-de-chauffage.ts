export const modesDeChauffage = [
  {
    label: 'Réseaux de chaleur',
    emissionsCO2PublicodesKey: 'Réseaux de chaleur x Collectif',
    coutPublicodeKey: 'Réseaux de chaleur',
  },
  {
    label: 'Réseaux de froid',
    emissionsCO2PublicodesKey: 'Réseaux de froid x Collectif',
    coutPublicodeKey: 'Réseaux de froid',
  },
  {
    label: 'Poêle à granulés individuel',
    emissionsCO2PublicodesKey: 'Poêle à granulés indiv x Individuel',
    coutPublicodeKey: 'Poêle à granulés indiv',
  },
  {
    label: 'Chaudière à granulés collective',
    emissionsCO2PublicodesKey: 'Chaudière à granulés coll x Collectif',
    coutPublicodeKey: 'Chaudière à granulés coll',
  },
  {
    label: 'Gaz à condensation individuel',
    emissionsCO2PublicodesKey: 'Gaz indiv avec cond x Individuel',
    coutPublicodeKey: 'Gaz indiv avec cond',
  },
  {
    label: 'Gaz sans condensation individuel',
    emissionsCO2PublicodesKey: 'Gaz indiv sans cond x Individuel',
    coutPublicodeKey: 'Gaz indiv sans cond',
  },
  {
    label: 'Gaz à condensation collectif',
    emissionsCO2PublicodesKey: 'Gaz coll avec cond x Collectif',
    coutPublicodeKey: 'Gaz coll avec cond',
  },
  {
    label: 'Gaz sans condensation collectif',
    emissionsCO2PublicodesKey: 'Gaz coll sans cond x Collectif',
    coutPublicodeKey: 'Gaz coll sans cond',
  },
  {
    label: 'Fioul individuel',
    emissionsCO2PublicodesKey: 'Fioul indiv x Individuel',
    coutPublicodeKey: 'Fioul indiv',
  },
  {
    label: 'Fioul collectif',
    emissionsCO2PublicodesKey: 'Fioul coll x Collectif',
    coutPublicodeKey: 'Fioul coll',
  },
  {
    label: 'PAC air/air individuelle',
    emissionsCO2PublicodesKey: 'PAC air-air x Individuel',
    coutPublicodeKey: 'PAC air-air indiv',
  },
  {
    label: 'PAC air/air collective / tertiaire',
    emissionsCO2PublicodesKey: 'PAC air-air x Collectif',
    coutPublicodeKey: 'PAC eau-eau indiv',
  },
  {
    label: 'PAC eau/eau individuelle',
    emissionsCO2PublicodesKey: 'PAC eau-eau x Individuel',
    coutPublicodeKey: 'PAC air-eau indiv',
  },
  {
    label: 'PAC eau/eau collective / tertiaire',
    emissionsCO2PublicodesKey: 'PAC eau-eau x Collectif',
    coutPublicodeKey: 'PAC air-air coll',
  },
  {
    label: 'PAC air/eau individuelle',
    emissionsCO2PublicodesKey: 'PAC air-eau x Individuel',
    coutPublicodeKey: 'PAC eau-eau coll',
  },
  {
    label: 'PAC air/eau collective / tertiaire',
    emissionsCO2PublicodesKey: 'PAC air-eau x Collectif',
    coutPublicodeKey: 'PAC air-eau coll',
  },
  {
    label: 'Radiateur électrique individuel',
    emissionsCO2PublicodesKey: 'Radiateur électrique x Individuel',
    coutPublicodeKey: 'Radiateur électrique',
  },
] as const;

export type ModeDeChauffage = (typeof modesDeChauffage)[number]['label'];
