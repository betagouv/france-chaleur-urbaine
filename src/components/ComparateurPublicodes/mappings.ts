import { type DottedName } from '@betagouv/france-chaleur-urbaine-publicodes';

import { type LocationInfoResponse } from '@/pages/api/location-infos';

export type ModeDeChauffageType = ('individuel' | 'collectif')[];

export const modesDeChauffage = [
  {
    label: 'Réseau de chaleur',
    emissionsCO2PublicodesKey: 'Réseaux de chaleur x Collectif',
    coutPublicodeKey: 'Réseaux de chaleur',
    reversible: false,
    tertiaire: true,
    type: ['individuel', 'collectif'] as ModeDeChauffageType,
    grandPublicMode: true,
  },
  {
    label: 'Chaudière à granulés collective',
    emissionsCO2PublicodesKey: 'Chaudière à granulés coll x Collectif',
    coutPublicodeKey: 'Chaudière à granulés coll',
    reversible: false,
    tertiaire: true,
    type: ['collectif'] as ModeDeChauffageType,
    grandPublicMode: false,
  },
  {
    label: 'Gaz à condensation collectif',
    emissionsCO2PublicodesKey: 'Gaz coll avec cond x Collectif',
    coutPublicodeKey: 'Gaz coll avec cond',
    reversible: false,
    tertiaire: true,
    type: ['collectif'] as ModeDeChauffageType,
    grandPublicMode: true,
  },
  {
    label: 'Gaz sans condensation collectif',
    emissionsCO2PublicodesKey: 'Gaz coll sans cond x Collectif',
    coutPublicodeKey: 'Gaz coll sans cond',
    reversible: false,
    tertiaire: true,
    type: ['collectif'] as ModeDeChauffageType,
    grandPublicMode: true,
  },
  {
    label: 'Fioul collectif',
    emissionsCO2PublicodesKey: 'Fioul coll x Collectif',
    coutPublicodeKey: 'Fioul coll',
    reversible: false,
    tertiaire: true,
    type: ['collectif'] as ModeDeChauffageType,
    grandPublicMode: true,
  },
  {
    label: 'PAC air/air collective',
    emissionsCO2PublicodesKey: 'PAC air-air x Collectif',
    coutPublicodeKey: 'PAC air-air coll',
    reversible: true,
    tertiaire: true,
    type: ['collectif'] as ModeDeChauffageType,
    grandPublicMode: false,
  },
  {
    label: 'PAC air/eau collective',
    emissionsCO2PublicodesKey: 'PAC air-eau x Collectif',
    coutPublicodeKey: 'PAC air-eau coll',
    reversible: true,
    tertiaire: true,
    type: ['collectif'] as ModeDeChauffageType,
    grandPublicMode: false,
  },
  {
    label: 'PAC eau/eau collective',
    emissionsCO2PublicodesKey: 'PAC eau-eau x Collectif',
    coutPublicodeKey: 'PAC eau-eau coll',
    reversible: false,
    tertiaire: true,
    type: ['collectif'] as ModeDeChauffageType,
    grandPublicMode: false,
  },
  {
    label: 'Poêle à granulés individuel',
    emissionsCO2PublicodesKey: 'Poêle à granulés indiv x Individuel',
    coutPublicodeKey: 'Poêle à granulés indiv',
    reversible: false,
    tertiaire: false,
    type: ['individuel'] as ModeDeChauffageType,
    grandPublicMode: false,
  },
  {
    label: 'Gaz à condensation individuel',
    emissionsCO2PublicodesKey: 'Gaz indiv avec cond x Individuel',
    coutPublicodeKey: 'Gaz indiv avec cond',
    reversible: false,
    tertiaire: false,
    type: ['individuel'] as ModeDeChauffageType,
    grandPublicMode: true,
  },
  {
    label: 'Gaz sans condensation individuel',
    emissionsCO2PublicodesKey: 'Gaz indiv sans cond x Individuel',
    coutPublicodeKey: 'Gaz indiv sans cond',
    reversible: false,
    tertiaire: false,
    type: ['individuel'] as ModeDeChauffageType,
    grandPublicMode: true,
  },

  {
    label: 'Fioul individuel',
    emissionsCO2PublicodesKey: 'Fioul indiv x Individuel',
    coutPublicodeKey: 'Fioul indiv',
    reversible: false,
    tertiaire: false,
    type: ['individuel'] as ModeDeChauffageType,
    grandPublicMode: true,
  },

  {
    label: 'PAC air/air individuelle',
    emissionsCO2PublicodesKey: 'PAC air-air x Individuel',
    coutPublicodeKey: 'PAC air-air indiv',
    reversible: true,
    tertiaire: false,
    type: ['individuel'] as ModeDeChauffageType,
    grandPublicMode: false,
  },

  {
    label: 'PAC air/eau individuelle',
    emissionsCO2PublicodesKey: 'PAC air-eau x Individuel',
    coutPublicodeKey: 'PAC air-eau indiv',
    reversible: true,
    tertiaire: false,
    type: ['individuel'] as ModeDeChauffageType,
    grandPublicMode: false,
  },

  {
    label: 'PAC eau/eau individuelle',
    emissionsCO2PublicodesKey: 'PAC eau-eau x Individuel',
    coutPublicodeKey: 'PAC eau-eau indiv',
    reversible: false,
    tertiaire: false,
    type: ['individuel'] as ModeDeChauffageType,
    grandPublicMode: false,
  },

  {
    label: 'Radiateur électrique individuel',
    emissionsCO2PublicodesKey: 'Radiateur électrique x Individuel',
    coutPublicodeKey: 'Radiateur électrique',
    reversible: false,
    tertiaire: true,
    type: ['individuel'] as ModeDeChauffageType,
    grandPublicMode: false,
  },
] as const;

export type ModeDeChauffage = (typeof modesDeChauffage)[number]['label'];

export const addresseToPublicodesRules = {
  'caractéristique réseau de chaleur . contenu CO2': (infos) => infos.nearestReseauDeChaleur?.['contenu CO2'],
  'caractéristique réseau de chaleur . contenu CO2 ACV': (infos) => infos.nearestReseauDeChaleur?.['contenu CO2 ACV'],
  'caractéristique réseau de chaleur . livraisons totales': (infos) => infos.nearestReseauDeChaleur?.['livraisons_totale_MWh'],
  'caractéristique réseau de chaleur . part fixe': (infos) => infos.nearestReseauDeChaleur?.['PF%'],
  'caractéristique réseau de chaleur . part variable': (infos) => infos.nearestReseauDeChaleur?.['PV%'],
  'caractéristique réseau de chaleur . prix moyen': (infos) => infos.nearestReseauDeChaleur?.['PM'],
  'caractéristique réseau de chaleur . production totale': (infos) => infos.nearestReseauDeChaleur?.['production_totale_MWh'],
  'caractéristique réseau de chaleur . taux EnRR': (infos) => infos.nearestReseauDeChaleur?.['Taux EnR&R'],

  'caractéristique réseau de froid . contenu CO2': (infos) => infos.nearestReseauDeFroid?.['contenu CO2'],
  'caractéristique réseau de froid . contenu CO2 ACV': (infos) => infos.nearestReseauDeFroid?.['contenu CO2 ACV'],
  'caractéristique réseau de froid . livraisons totales': (infos) => infos.nearestReseauDeFroid?.['livraisons_totale_MWh'],
  'caractéristique réseau de froid . production totale': (infos) => infos.nearestReseauDeFroid?.['production_totale_MWh'],

  'code département': (infos) => `'${infos.infosVille.departement_id}'`,
  'température de référence chaud commune': (infos) => +infos.infosVille.temperature_ref_altitude_moyenne,
} as const satisfies Partial<Record<DottedName, (infos: LocationInfoResponse) => any>>;

export const addresseToPublicodesRulesKeys = Object.keys(addresseToPublicodesRules) as DottedName[];
