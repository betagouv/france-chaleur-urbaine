import type { RuleName } from '@betagouv/france-chaleur-urbaine-publicodes';

import type { LocationInfoResponse } from '@/pages/api/location-infos';

export type ModeDeChauffageType = ('individuel' | 'collectif')[];

export const modesDeChauffage = [
  {
    categorie: 'Réseaux de chaleur',
    grandPublicMode: true,
    label: 'Réseau de chaleur',
    publicodesKey: 'réseau de chaleur',
    reversible: false,
    tertiaire: true,
    type: ['individuel', 'collectif'] as ModeDeChauffageType,
  },
  {
    categorie: 'Granulés',
    grandPublicMode: false,
    label: 'Chaudière à granulés collective',
    publicodesKey: 'chaudière à granulés',
    reversible: false,
    tertiaire: true,
    type: ['collectif'] as ModeDeChauffageType,
  },
  {
    categorie: 'Gaz',
    grandPublicMode: true,
    label: 'Gaz à condensation collectif',
    publicodesKey: 'gaz coll avec cond',
    reversible: false,
    tertiaire: true,
    type: ['collectif'] as ModeDeChauffageType,
  },
  {
    categorie: 'Gaz',
    grandPublicMode: true,
    label: 'Gaz sans condensation collectif',
    publicodesKey: 'gaz coll sans cond',
    reversible: false,
    tertiaire: true,
    type: ['collectif'] as ModeDeChauffageType,
  },
  {
    categorie: 'Fioul',
    grandPublicMode: true,
    label: 'Fioul collectif',
    publicodesKey: 'fioul coll',
    reversible: false,
    tertiaire: true,
    type: ['collectif'] as ModeDeChauffageType,
  },
  {
    categorie: 'PAC',
    grandPublicMode: false,
    label: 'PAC air/air collective',
    publicodesKey: 'PAC air-air coll',
    reversible: true,
    tertiaire: true,
    type: ['collectif'] as ModeDeChauffageType,
  },
  {
    categorie: 'PAC',
    grandPublicMode: false,
    label: 'PAC air/eau collective',
    publicodesKey: 'PAC air-eau coll',
    reversible: true,
    tertiaire: true,
    type: ['collectif'] as ModeDeChauffageType,
  },
  {
    categorie: 'PAC',
    grandPublicMode: false,
    label: 'PAC eau/eau collective',
    publicodesKey: 'PAC eau-eau coll',
    reversible: false,
    tertiaire: true,
    type: ['collectif'] as ModeDeChauffageType,
  },
  {
    categorie: 'Granulés',
    grandPublicMode: false,
    label: 'Poêle à granulés individuel',
    publicodesKey: 'poêle à granulés',
    reversible: false,
    tertiaire: false,
    type: ['individuel'] as ModeDeChauffageType,
  },
  {
    categorie: 'Gaz',
    grandPublicMode: true,
    label: 'Gaz à condensation individuel',
    publicodesKey: 'gaz indiv avec cond',
    reversible: false,
    tertiaire: false,
    type: ['individuel'] as ModeDeChauffageType,
  },
  {
    categorie: 'Gaz',
    grandPublicMode: true,
    label: 'Gaz sans condensation individuel',
    publicodesKey: 'gaz indiv sans cond',
    reversible: false,
    tertiaire: false,
    type: ['individuel'] as ModeDeChauffageType,
  },

  {
    categorie: 'Fioul',
    grandPublicMode: true,
    label: 'Fioul individuel',
    publicodesKey: 'fioul indiv',
    reversible: false,
    tertiaire: false,
    type: ['individuel'] as ModeDeChauffageType,
  },

  {
    categorie: 'PAC',
    grandPublicMode: false,
    label: 'PAC air/air individuelle',
    publicodesKey: 'PAC air-air indiv',
    reversible: true,
    tertiaire: false,
    type: ['individuel'] as ModeDeChauffageType,
  },

  {
    categorie: 'PAC',
    grandPublicMode: false,
    label: 'PAC air/eau individuelle',
    publicodesKey: 'PAC air-eau indiv',
    reversible: true,
    tertiaire: false,
    type: ['individuel'] as ModeDeChauffageType,
  },

  {
    categorie: 'PAC',
    grandPublicMode: false,
    label: 'PAC eau/eau individuelle',
    publicodesKey: 'PAC eau-eau indiv',
    reversible: false,
    tertiaire: false,
    type: ['individuel'] as ModeDeChauffageType,
  },
  {
    categorie: 'Radiateur électrique',
    grandPublicMode: false,
    label: 'Radiateur électrique individuel',
    publicodesKey: 'radiateur électrique',
    reversible: false,
    tertiaire: true,
    type: ['individuel'] as ModeDeChauffageType,
  },
] as const;

export type ModeDeChauffage = (typeof modesDeChauffage)[number]['label'];

export const addresseToPublicodesRules = {
  'caractéristique réseau de chaleur . contenu CO2': (infos) => infos.nearestReseauDeChaleur?.['contenu CO2'],
  'caractéristique réseau de chaleur . contenu CO2 ACV': (infos) => infos.nearestReseauDeChaleur?.['contenu CO2 ACV'],
  'caractéristique réseau de chaleur . livraisons totales': (infos) => infos.nearestReseauDeChaleur?.livraisons_totale_MWh,
  'caractéristique réseau de chaleur . part fixe': (infos) => infos.nearestReseauDeChaleur?.['PF%'],
  'caractéristique réseau de chaleur . part variable': (infos) => infos.nearestReseauDeChaleur?.['PV%'],
  'caractéristique réseau de chaleur . prix moyen': (infos) => infos.nearestReseauDeChaleur?.PM,
  'caractéristique réseau de chaleur . production totale': (infos) => infos.nearestReseauDeChaleur?.production_totale_MWh,
  'caractéristique réseau de chaleur . taux EnRR': (infos) => infos.nearestReseauDeChaleur?.['Taux EnR&R'],

  'caractéristique réseau de froid . contenu CO2': (infos) => infos.nearestReseauDeFroid?.['contenu CO2'],
  'caractéristique réseau de froid . contenu CO2 ACV': (infos) => infos.nearestReseauDeFroid?.['contenu CO2 ACV'],
  'caractéristique réseau de froid . livraisons totales': (infos) => infos.nearestReseauDeFroid?.livraisons_totale_MWh,
  'caractéristique réseau de froid . production totale': (infos) => infos.nearestReseauDeFroid?.production_totale_MWh,

  'code département': (infos) => `'${infos.infosVille.departement_id}'`,
  'température de référence chaud commune': (infos) => +infos.infosVille.temperature_ref_altitude_moyenne,
} as const satisfies Partial<Record<RuleName, (infos: LocationInfoResponse) => any>>;

export const addresseToPublicodesRulesKeys = Object.keys(addresseToPublicodesRules) as RuleName[];
