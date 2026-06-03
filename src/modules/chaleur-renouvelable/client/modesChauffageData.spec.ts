import { describe, expect, it, vi } from 'vitest';

vi.mock('@/modules/simulator/client/SimulateurCoutRaccordement', () => ({
  getCoutRaccordementResidentiel: () => [1000, 2000],
  prettyPrintCout: (value: number) => `${value} €`,
}));

import type { HeatNetwork } from '@/types/HeatNetworksResponse';

import { TYPE_LOGEMENT_VALUES, type TypeLogement } from '../constants';
import {
  getIncompatibleSolutionRows,
  type ModeDeChauffage,
  type ModeDeChauffageUsage,
  modesDeChauffage,
  type Situation,
} from './modesChauffageData';

type SituationOverrides = Partial<Situation>;

type ImpossibleCase = {
  description: string;
  overrides: SituationOverrides;
};

type HeatingModeCase = {
  typeLogement: TypeLogement;
  label: string;
  usage: ModeDeChauffageUsage;
  possibleOverrides: SituationOverrides;
  additionalPossibleCases?: ImpossibleCase[];
  impossibleCases: ImpossibleCase[];
};

type IncompatibilityCase = {
  typeLogement: TypeLogement;
  label: string;
  usage: ModeDeChauffageUsage;
  reason: string;
  source: string;
  overrides: SituationOverrides;
};

const createHeatNetwork = (overrides: Partial<HeatNetwork> = {}): HeatNetwork => ({
  co2: null,
  distance: 100,
  futurNetwork: false,
  gestionnaire: null,
  hasNoTraceNetwork: false,
  hasPDP: false,
  id: null,
  inPDP: false,
  isClasse: false,
  isEligible: true,
  name: null,
  tauxENRR: null,
  veryEligibleDistance: 50,
  ...overrides,
});

const createSituation = (overrides: SituationOverrides = {}): Situation => ({
  adresse: '1 rue de la Paix, Paris',
  architecturalProtectionAc1: false,
  architecturalProtectionAc2: false,
  architecturalProtectionAc3: false,
  architecturalProtectionAc4: false,
  architecturalProtectionAc4bis: false,
  dpe: 'D',
  eligibiliteReseauChaleur: createHeatNetwork(),
  espaceExterieur: 'both',
  geothermalNappeGmi: 1,
  geothermalNappePotential: 7,
  geothermalSondeGmi: 1,
  geothermiePossible: true,
  habitantsMoyen: 2,
  hasGeothermalProbeSpace: true,
  modeEauChaudeSanitaire: null,
  nbLogements: 25,
  planProtectionAtmosphere: false,
  solarThermalCoverage: 90,
  surfaceMoyenne: 70,
  typeRadiateur: 'radiateur-eau',
  ...overrides,
});

const getMode = (typeLogement: TypeLogement, label: string, usage: ModeDeChauffageUsage): ModeDeChauffage => {
  const heatingMode = modesDeChauffage[typeLogement].find((modeDeChauffage) => {
    return modeDeChauffage.label === label && modeDeChauffage.usage === usage;
  });

  if (!heatingMode) {
    throw new Error(`Heating mode not found: ${typeLogement} / ${label} / ${usage}`);
  }

  return heatingMode;
};

const getModeKey = (testCase: Pick<HeatingModeCase, 'typeLogement' | 'label' | 'usage'>) =>
  `${testCase.typeLogement} / ${testCase.label} / ${testCase.usage}`;

const heatingModeCases: HeatingModeCase[] = [
  {
    impossibleCases: [
      {
        description: 'quand le bâtiment n’est pas éligible',
        overrides: { eligibiliteReseauChaleur: createHeatNetwork({ isEligible: false }) },
      },
      {
        description: 'quand le réseau est à 200 m',
        overrides: { eligibiliteReseauChaleur: createHeatNetwork({ distance: 200 }) },
      },
      {
        description: 'sans radiateur à eau',
        overrides: { typeRadiateur: 'radiateur-electrique' },
      },
    ],
    label: 'Réseau de chaleur',
    possibleOverrides: {},
    typeLogement: 'immeuble_chauffage_collectif',
    usage: 'heatingAndHotWater',
  },
  {
    additionalPossibleCases: [
      {
        description: 'quand la ressource géothermique est inconnue',
        overrides: { geothermalNappePotential: 0, modeEauChaudeSanitaire: 'Collectif' },
      },
    ],
    impossibleCases: [
      {
        description: 'sans espace extérieur commun',
        overrides: { espaceExterieur: 'private', modeEauChaudeSanitaire: 'Collectif' },
      },
      {
        description: 'sans radiateur à eau',
        overrides: { modeEauChaudeSanitaire: 'Collectif', typeRadiateur: 'radiateur-electrique' },
      },
      {
        description: 'quand la géothermie est impossible',
        overrides: { geothermiePossible: false, modeEauChaudeSanitaire: 'Collectif' },
      },
      {
        description: 'en zone défavorable au forage',
        overrides: { geothermalNappeGmi: 3, geothermalSondeGmi: 3, modeEauChaudeSanitaire: 'Collectif' },
      },
      {
        description: 'avec une ressource énergétique insuffisante',
        overrides: { geothermalNappePotential: 5, modeEauChaudeSanitaire: 'Collectif' },
      },
      {
        description: 'sans place pour les sondes',
        overrides: { hasGeothermalProbeSpace: false, modeEauChaudeSanitaire: 'Collectif' },
      },
    ],
    label: 'Pompe à chaleur géothermique',
    possibleOverrides: { modeEauChaudeSanitaire: 'Collectif' },
    typeLogement: 'immeuble_chauffage_collectif',
    usage: 'heatingAndHotWater',
  },
  {
    impossibleCases: [
      {
        description: 'sans espace extérieur commun',
        overrides: { espaceExterieur: 'private', modeEauChaudeSanitaire: 'Collectif' },
      },
      {
        description: 'sans radiateur à eau',
        overrides: { modeEauChaudeSanitaire: 'Collectif', typeRadiateur: 'radiateur-electrique' },
      },
    ],
    label: 'Chaudière biomasse',
    possibleOverrides: { modeEauChaudeSanitaire: 'Collectif' },
    typeLogement: 'immeuble_chauffage_collectif',
    usage: 'heatingAndHotWater',
  },
  {
    impossibleCases: [
      {
        description: 'sans espace extérieur commun',
        overrides: { espaceExterieur: 'private', modeEauChaudeSanitaire: 'Collectif' },
      },
      {
        description: 'sans radiateur à eau',
        overrides: { modeEauChaudeSanitaire: 'Collectif', typeRadiateur: 'radiateur-electrique' },
      },
    ],
    label: 'Pompe à chaleur air-eau collective',
    possibleOverrides: { modeEauChaudeSanitaire: 'Collectif' },
    typeLogement: 'immeuble_chauffage_collectif',
    usage: 'heatingAndHotWater',
  },
  {
    impossibleCases: [
      {
        description: 'sans espace extérieur commun',
        overrides: { espaceExterieur: 'private', modeEauChaudeSanitaire: 'Collectif' },
      },
      {
        description: 'sans radiateur à eau',
        overrides: { modeEauChaudeSanitaire: 'Collectif', typeRadiateur: 'radiateur-electrique' },
      },
    ],
    label: 'Hybride : PAC air/eau collective et chaudière gaz',
    possibleOverrides: { modeEauChaudeSanitaire: 'Collectif' },
    typeLogement: 'immeuble_chauffage_collectif',
    usage: 'heatingAndHotWater',
  },
  {
    impossibleCases: [
      {
        description: 'sans espace extérieur commun',
        overrides: { espaceExterieur: 'private', modeEauChaudeSanitaire: 'Collectif' },
      },
      {
        description: 'avec une eau chaude individuelle',
        overrides: { modeEauChaudeSanitaire: 'Individuel' },
      },
      {
        description: 'avec une couverture solaire insuffisante',
        overrides: { modeEauChaudeSanitaire: 'Collectif', solarThermalCoverage: 79 },
      },
      {
        description: 'avec une couverture solaire égale au seuil',
        overrides: { modeEauChaudeSanitaire: 'Collectif', solarThermalCoverage: 80 },
      },
      {
        description: 'sans couverture solaire connue',
        overrides: { modeEauChaudeSanitaire: 'Collectif', solarThermalCoverage: null },
      },
    ],
    label: 'Solaire thermique',
    possibleOverrides: { modeEauChaudeSanitaire: 'Collectif' },
    typeLogement: 'immeuble_chauffage_collectif',
    usage: 'hotWaterOnly',
  },
  {
    impossibleCases: [
      {
        description: 'sans espace extérieur commun',
        overrides: { espaceExterieur: 'private', modeEauChaudeSanitaire: 'Collectif' },
      },
      {
        description: 'avec une eau chaude individuelle',
        overrides: { modeEauChaudeSanitaire: 'Individuel' },
      },
    ],
    label: 'PAC sur capteurs solaires atmosphériques',
    possibleOverrides: { modeEauChaudeSanitaire: 'Collectif' },
    typeLogement: 'immeuble_chauffage_collectif',
    usage: 'hotWaterOnly',
  },
  {
    impossibleCases: [
      {
        description: 'sans espace extérieur commun',
        overrides: { espaceExterieur: 'private', modeEauChaudeSanitaire: 'Collectif' },
      },
      {
        description: 'avec une eau chaude individuelle',
        overrides: { modeEauChaudeSanitaire: 'Individuel' },
      },
    ],
    label: 'Pompe à chaleur air-eau collective',
    possibleOverrides: { modeEauChaudeSanitaire: 'Collectif' },
    typeLogement: 'immeuble_chauffage_collectif',
    usage: 'hotWaterOnly',
  },
  {
    impossibleCases: [
      {
        description: 'sans espace extérieur privatif',
        overrides: { espaceExterieur: 'shared', modeEauChaudeSanitaire: 'Individuel' },
      },
      {
        description: 'avec une eau chaude collective',
        overrides: { modeEauChaudeSanitaire: 'Collectif' },
      },
    ],
    label: 'Chauffe-eau thermodynamique',
    possibleOverrides: { modeEauChaudeSanitaire: 'Individuel' },
    typeLogement: 'immeuble_chauffage_collectif',
    usage: 'hotWaterOnly',
  },
  {
    impossibleCases: [
      {
        description: 'sans espace extérieur privatif',
        overrides: { espaceExterieur: 'shared', modeEauChaudeSanitaire: 'Individuel' },
      },
      {
        description: 'avec une eau chaude collective',
        overrides: { modeEauChaudeSanitaire: 'Collectif' },
      },
      {
        description: 'sans radiateur à eau',
        overrides: { modeEauChaudeSanitaire: 'Individuel', typeRadiateur: 'radiateur-electrique' },
      },
    ],
    label: 'Pompe à chaleur air-eau individuelle',
    possibleOverrides: { modeEauChaudeSanitaire: 'Individuel' },
    typeLogement: 'immeuble_chauffage_individuel',
    usage: 'heatingAndHotWater',
  },
  {
    additionalPossibleCases: [
      {
        description: 'sans radiateur existant',
        overrides: { modeEauChaudeSanitaire: 'Individuel', typeRadiateur: 'none' },
      },
    ],
    impossibleCases: [
      {
        description: 'sans espace extérieur privatif',
        overrides: { espaceExterieur: 'shared', modeEauChaudeSanitaire: 'Individuel', typeRadiateur: 'radiateur-electrique' },
      },
      {
        description: 'avec des radiateurs à eau',
        overrides: { modeEauChaudeSanitaire: 'Individuel', typeRadiateur: 'radiateur-eau' },
      },
    ],
    label: 'Pompe à chaleur air-air individuelle',
    possibleOverrides: { modeEauChaudeSanitaire: 'Individuel', typeRadiateur: 'radiateur-electrique' },
    typeLogement: 'immeuble_chauffage_individuel',
    usage: 'heatingAndHotWater',
  },
  {
    impossibleCases: [
      {
        description: 'sans espace extérieur privatif',
        overrides: { espaceExterieur: 'shared', modeEauChaudeSanitaire: 'Collectif' },
      },
      {
        description: 'avec une eau chaude individuelle',
        overrides: { modeEauChaudeSanitaire: 'Individuel' },
      },
      {
        description: 'avec une couverture solaire insuffisante',
        overrides: { modeEauChaudeSanitaire: 'Collectif', solarThermalCoverage: 79 },
      },
      {
        description: 'avec une couverture solaire égale au seuil',
        overrides: { modeEauChaudeSanitaire: 'Collectif', solarThermalCoverage: 80 },
      },
      {
        description: 'sans couverture solaire connue',
        overrides: { modeEauChaudeSanitaire: 'Collectif', solarThermalCoverage: null },
      },
    ],
    label: 'Solaire thermique',
    possibleOverrides: { modeEauChaudeSanitaire: 'Collectif' },
    typeLogement: 'immeuble_chauffage_individuel',
    usage: 'hotWaterOnly',
  },
  {
    impossibleCases: [
      {
        description: 'sans espace extérieur commun',
        overrides: { espaceExterieur: 'private', modeEauChaudeSanitaire: 'Collectif' },
      },
      {
        description: 'avec une eau chaude individuelle',
        overrides: { espaceExterieur: 'shared', modeEauChaudeSanitaire: 'Individuel' },
      },
    ],
    label: 'PAC sur capteurs solaires atmosphériques',
    possibleOverrides: { espaceExterieur: 'shared', modeEauChaudeSanitaire: 'Collectif' },
    typeLogement: 'immeuble_chauffage_individuel',
    usage: 'hotWaterOnly',
  },
  {
    impossibleCases: [
      {
        description: 'sans espace extérieur privatif',
        overrides: { espaceExterieur: 'shared', modeEauChaudeSanitaire: 'Individuel' },
      },
      {
        description: 'avec une eau chaude collective',
        overrides: { modeEauChaudeSanitaire: 'Collectif' },
      },
    ],
    label: 'Chauffe-eau thermodynamique',
    possibleOverrides: { modeEauChaudeSanitaire: 'Individuel' },
    typeLogement: 'immeuble_chauffage_individuel',
    usage: 'hotWaterOnly',
  },
  {
    impossibleCases: [
      {
        description: 'sans espace extérieur commun',
        overrides: { espaceExterieur: 'private', modeEauChaudeSanitaire: 'Collectif' },
      },
      {
        description: 'avec une eau chaude individuelle',
        overrides: { espaceExterieur: 'shared', modeEauChaudeSanitaire: 'Individuel' },
      },
    ],
    label: 'Pompe à chaleur air-eau collective',
    possibleOverrides: { espaceExterieur: 'shared', modeEauChaudeSanitaire: 'Collectif' },
    typeLogement: 'immeuble_chauffage_individuel',
    usage: 'hotWaterOnly',
  },
  {
    additionalPossibleCases: [
      {
        description: 'quand la ressource géothermique est inconnue',
        overrides: { espaceExterieur: 'jardinCours', geothermalNappePotential: 0, modeEauChaudeSanitaire: 'Collectif' },
      },
    ],
    impossibleCases: [
      {
        description: 'sans espace extérieur adapté aux équipements',
        overrides: { espaceExterieur: 'terrasseBalcon', modeEauChaudeSanitaire: 'Collectif' },
      },
      {
        description: 'avec une eau chaude individuelle',
        overrides: { espaceExterieur: 'jardinCours', modeEauChaudeSanitaire: 'Individuel' },
      },
      {
        description: 'sans radiateur à eau',
        overrides: { espaceExterieur: 'jardinCours', modeEauChaudeSanitaire: 'Collectif', typeRadiateur: 'radiateur-electrique' },
      },
      {
        description: 'quand la géothermie est impossible',
        overrides: { espaceExterieur: 'jardinCours', geothermiePossible: false, modeEauChaudeSanitaire: 'Collectif' },
      },
      {
        description: 'en zone défavorable au forage',
        overrides: { espaceExterieur: 'jardinCours', geothermalNappeGmi: 3, geothermalSondeGmi: 3, modeEauChaudeSanitaire: 'Collectif' },
      },
      {
        description: 'avec une ressource énergétique insuffisante',
        overrides: { espaceExterieur: 'jardinCours', geothermalNappePotential: 5, modeEauChaudeSanitaire: 'Collectif' },
      },
      {
        description: 'sans place pour les sondes',
        overrides: { espaceExterieur: 'jardinCours', hasGeothermalProbeSpace: false, modeEauChaudeSanitaire: 'Collectif' },
      },
    ],
    label: 'Pompe à chaleur géothermique',
    possibleOverrides: { espaceExterieur: 'jardinCours', modeEauChaudeSanitaire: 'Collectif' },
    typeLogement: 'maison_individuelle',
    usage: 'heatingAndHotWater',
  },
  {
    impossibleCases: [
      {
        description: 'sans espace extérieur adapté aux équipements',
        overrides: { espaceExterieur: 'terrasseBalcon', modeEauChaudeSanitaire: 'Individuel' },
      },
      {
        description: 'sans radiateur à eau',
        overrides: { espaceExterieur: 'jardinCours', modeEauChaudeSanitaire: 'Individuel', typeRadiateur: 'radiateur-electrique' },
      },
    ],
    label: 'Chaudière biomasse',
    possibleOverrides: { espaceExterieur: 'jardinCours', modeEauChaudeSanitaire: 'Individuel' },
    typeLogement: 'maison_individuelle',
    usage: 'heatingAndHotWater',
  },
  {
    impossibleCases: [
      {
        description: 'sans espace extérieur',
        overrides: { espaceExterieur: 'none', modeEauChaudeSanitaire: 'Individuel' },
      },
      {
        description: 'avec une eau chaude collective',
        overrides: { espaceExterieur: 'terrasseBalcon', modeEauChaudeSanitaire: 'Collectif' },
      },
      {
        description: 'sans radiateur à eau',
        overrides: { espaceExterieur: 'terrasseBalcon', modeEauChaudeSanitaire: 'Individuel', typeRadiateur: 'radiateur-electrique' },
      },
    ],
    label: 'Pompe à chaleur air-eau individuelle',
    possibleOverrides: { espaceExterieur: 'terrasseBalcon', modeEauChaudeSanitaire: 'Individuel' },
    typeLogement: 'maison_individuelle',
    usage: 'heatingAndHotWater',
  },
  {
    impossibleCases: [
      {
        description: 'sans espace extérieur',
        overrides: { espaceExterieur: 'none', modeEauChaudeSanitaire: 'Individuel' },
      },
      {
        description: 'avec une eau chaude collective',
        overrides: { espaceExterieur: 'terrasseBalcon', modeEauChaudeSanitaire: 'Collectif' },
      },
    ],
    label: 'Poêle à buche ou à granulés ',
    possibleOverrides: { espaceExterieur: 'terrasseBalcon', modeEauChaudeSanitaire: 'Individuel' },
    typeLogement: 'maison_individuelle',
    usage: 'heatingAndHotWater',
  },
  {
    impossibleCases: [
      {
        description: 'sans espace extérieur',
        overrides: { espaceExterieur: 'none', modeEauChaudeSanitaire: 'Individuel' },
      },
      {
        description: 'avec une eau chaude collective',
        overrides: { espaceExterieur: 'terrasseBalcon', modeEauChaudeSanitaire: 'Collectif' },
      },
    ],
    label: 'Pompe à chaleur air-air individuelle',
    possibleOverrides: { espaceExterieur: 'terrasseBalcon', modeEauChaudeSanitaire: 'Individuel' },
    typeLogement: 'maison_individuelle',
    usage: 'heatingAndHotWater',
  },
  {
    impossibleCases: [
      {
        description: 'sans espace extérieur',
        overrides: { espaceExterieur: 'none', modeEauChaudeSanitaire: 'Individuel' },
      },
      {
        description: 'sans radiateur à eau',
        overrides: { espaceExterieur: 'terrasseBalcon', modeEauChaudeSanitaire: 'Individuel', typeRadiateur: 'radiateur-electrique' },
      },
    ],
    label: 'Système solaire combiné ',
    possibleOverrides: { espaceExterieur: 'terrasseBalcon', modeEauChaudeSanitaire: 'Individuel' },
    typeLogement: 'maison_individuelle',
    usage: 'heatingAndHotWater',
  },
  {
    impossibleCases: [
      {
        description: 'sans espace extérieur privatif',
        overrides: { espaceExterieur: 'none', modeEauChaudeSanitaire: 'Individuel' },
      },
      {
        description: 'avec une eau chaude collective',
        overrides: { espaceExterieur: 'terrasseBalcon', modeEauChaudeSanitaire: 'Collectif' },
      },
    ],
    label: 'Chauffe-eau thermodynamique',
    possibleOverrides: { espaceExterieur: 'terrasseBalcon', modeEauChaudeSanitaire: 'Individuel' },
    typeLogement: 'maison_individuelle',
    usage: 'hotWaterOnly',
  },
];

const incompatibilityCases: IncompatibilityCase[] = [
  {
    label: 'Réseau de chaleur',
    overrides: { eligibiliteReseauChaleur: createHeatNetwork({ distance: 200 }) },
    reason: 'Votre bâtiment est trop éloigné d’un réseau de chaleur',
    source: 'France Chaleur Urbaine',
    typeLogement: 'immeuble_chauffage_collectif',
    usage: 'heatingAndHotWater',
  },
  {
    label: 'Pompe à chaleur géothermique',
    overrides: { espaceExterieur: 'private', modeEauChaudeSanitaire: 'Collectif' },
    reason: 'Vous ne disposez pas d’espace extérieur pour disposer les sondes',
    source: 'Formulaire',
    typeLogement: 'immeuble_chauffage_collectif',
    usage: 'heatingAndHotWater',
  },
  {
    label: 'Pompe à chaleur géothermique',
    overrides: { geothermalNappeGmi: 3, modeEauChaudeSanitaire: 'Collectif' },
    reason: 'Votre bâtiment est situé dans une zone défavorable au forage',
    source: 'Cerema',
    typeLogement: 'immeuble_chauffage_collectif',
    usage: 'heatingAndHotWater',
  },
  {
    label: 'Pompe à chaleur géothermique',
    overrides: { geothermalNappePotential: 5, modeEauChaudeSanitaire: 'Collectif' },
    reason: 'La ressource énergétique de la parcelle est insuffisante',
    source: 'Cerema',
    typeLogement: 'immeuble_chauffage_collectif',
    usage: 'heatingAndHotWater',
  },
  {
    label: 'Pompe à chaleur géothermique',
    overrides: { hasGeothermalProbeSpace: false, modeEauChaudeSanitaire: 'Collectif' },
    reason: 'Place insuffisante pour l’implantation de sondes géothermiques',
    source: 'Cerema',
    typeLogement: 'immeuble_chauffage_collectif',
    usage: 'heatingAndHotWater',
  },
  {
    label: 'Chaudière biomasse',
    overrides: { espaceExterieur: 'private', modeEauChaudeSanitaire: 'Collectif' },
    reason: 'Vous ne disposez pas d’espace extérieur pour le stockage de combustible',
    source: 'Formulaire',
    typeLogement: 'immeuble_chauffage_collectif',
    usage: 'heatingAndHotWater',
  },
  {
    label: 'Pompe à chaleur air-eau collective',
    overrides: { espaceExterieur: 'private', modeEauChaudeSanitaire: 'Collectif' },
    reason: 'Vous ne disposez pas d’espace extérieur pour disposer l’unité extérieure',
    source: 'Formulaire',
    typeLogement: 'immeuble_chauffage_collectif',
    usage: 'heatingAndHotWater',
  },
  {
    label: 'Hybride : PAC air/eau collective et chaudière gaz',
    overrides: { espaceExterieur: 'private', modeEauChaudeSanitaire: 'Collectif' },
    reason: 'Vous ne disposez pas d’espace extérieur pour disposer l’unité extérieure',
    source: 'Formulaire',
    typeLogement: 'immeuble_chauffage_collectif',
    usage: 'heatingAndHotWater',
  },
  {
    label: 'Solaire thermique',
    overrides: { modeEauChaudeSanitaire: 'Collectif', solarThermalCoverage: 79 },
    reason: 'La place disponible en toiture est insuffisante ou l’orientation n’est pas idéale.',
    source: 'Cerema',
    typeLogement: 'immeuble_chauffage_collectif',
    usage: 'hotWaterOnly',
  },
  {
    label: 'Pompe à chaleur air-eau individuelle',
    overrides: { espaceExterieur: 'shared', modeEauChaudeSanitaire: 'Individuel' },
    reason: 'Vous ne disposez pas d’espace extérieur pour installer l’unité extérieure',
    source: 'Formulaire',
    typeLogement: 'immeuble_chauffage_individuel',
    usage: 'heatingAndHotWater',
  },
  {
    label: 'Pompe à chaleur air-eau individuelle',
    overrides: { modeEauChaudeSanitaire: 'Individuel', typeRadiateur: 'radiateur-electrique' },
    reason: 'Vous ne disposez pas de radiateur à eau',
    source: 'Formulaire',
    typeLogement: 'immeuble_chauffage_individuel',
    usage: 'heatingAndHotWater',
  },
  {
    label: 'Pompe à chaleur air-air individuelle',
    overrides: { espaceExterieur: 'shared', modeEauChaudeSanitaire: 'Individuel', typeRadiateur: 'radiateur-electrique' },
    reason: 'Vous ne disposez pas d’espace extérieur pour installer l’unité extérieure',
    source: 'Formulaire',
    typeLogement: 'immeuble_chauffage_individuel',
    usage: 'heatingAndHotWater',
  },
  {
    label: 'Pompe à chaleur air-air individuelle',
    overrides: { modeEauChaudeSanitaire: 'Individuel', typeRadiateur: 'radiateur-eau' },
    reason: 'Vous disposez de radiateurs à eau qui pourraient être mieux valorisés',
    source: 'Formulaire',
    typeLogement: 'immeuble_chauffage_individuel',
    usage: 'heatingAndHotWater',
  },
  {
    label: 'Solaire thermique',
    overrides: { modeEauChaudeSanitaire: 'Collectif', solarThermalCoverage: 79 },
    reason: 'La place disponible en toiture est insuffisante ou l’orientation n’est pas idéale.',
    source: 'Cerema',
    typeLogement: 'immeuble_chauffage_individuel',
    usage: 'hotWaterOnly',
  },
  {
    label: 'Pompe à chaleur géothermique',
    overrides: { espaceExterieur: 'terrasseBalcon', modeEauChaudeSanitaire: 'Collectif' },
    reason: 'Vous ne disposez pas d’espace extérieur pour disposer les sondes',
    source: 'Formulaire',
    typeLogement: 'maison_individuelle',
    usage: 'heatingAndHotWater',
  },
  {
    label: 'Pompe à chaleur géothermique',
    overrides: { espaceExterieur: 'jardinCours', geothermalNappeGmi: 3, modeEauChaudeSanitaire: 'Collectif' },
    reason: 'Votre bâtiment est situé dans une zone défavorable au forage',
    source: 'Cerema',
    typeLogement: 'maison_individuelle',
    usage: 'heatingAndHotWater',
  },
  {
    label: 'Pompe à chaleur géothermique',
    overrides: { espaceExterieur: 'jardinCours', geothermalNappePotential: 5, modeEauChaudeSanitaire: 'Collectif' },
    reason: 'La ressource énergétique de la parcelle est insuffisante',
    source: 'Cerema',
    typeLogement: 'maison_individuelle',
    usage: 'heatingAndHotWater',
  },
  {
    label: 'Pompe à chaleur géothermique',
    overrides: { espaceExterieur: 'jardinCours', hasGeothermalProbeSpace: false, modeEauChaudeSanitaire: 'Collectif' },
    reason: 'Place insuffisante pour l’implantation de sondes géothermiques',
    source: 'Cerema',
    typeLogement: 'maison_individuelle',
    usage: 'heatingAndHotWater',
  },
  {
    label: 'Pompe à chaleur géothermique',
    overrides: { espaceExterieur: 'jardinCours', modeEauChaudeSanitaire: 'Collectif', typeRadiateur: 'radiateur-electrique' },
    reason: 'Vous ne disposez pas de radiateur à eau',
    source: 'Formulaire',
    typeLogement: 'maison_individuelle',
    usage: 'heatingAndHotWater',
  },
  {
    label: 'Chaudière biomasse',
    overrides: { espaceExterieur: 'terrasseBalcon', modeEauChaudeSanitaire: 'Individuel' },
    reason: 'Vous ne disposez pas d’espace extérieur pour le stockage de combustible',
    source: 'Formulaire',
    typeLogement: 'maison_individuelle',
    usage: 'heatingAndHotWater',
  },
  {
    label: 'Chaudière biomasse',
    overrides: { espaceExterieur: 'jardinCours', modeEauChaudeSanitaire: 'Individuel', typeRadiateur: 'radiateur-electrique' },
    reason: 'Vous ne disposez pas de radiateur à eau',
    source: 'Formulaire',
    typeLogement: 'maison_individuelle',
    usage: 'heatingAndHotWater',
  },
  {
    label: 'Pompe à chaleur air-eau individuelle',
    overrides: { espaceExterieur: 'none', modeEauChaudeSanitaire: 'Individuel' },
    reason: 'Vous ne disposez pas d’espace extérieur pour disposer l’unité extérieure de la PAC',
    source: 'Formulaire',
    typeLogement: 'maison_individuelle',
    usage: 'heatingAndHotWater',
  },
  {
    label: 'Pompe à chaleur air-eau individuelle',
    overrides: { espaceExterieur: 'terrasseBalcon', modeEauChaudeSanitaire: 'Individuel', typeRadiateur: 'radiateur-electrique' },
    reason: 'Vous ne disposez pas de radiateur à eau',
    source: 'Formulaire',
    typeLogement: 'maison_individuelle',
    usage: 'heatingAndHotWater',
  },
  {
    label: 'Poêle à buche ou à granulés ',
    overrides: { espaceExterieur: 'none', modeEauChaudeSanitaire: 'Individuel' },
    reason: 'Vous ne disposez pas d’espace extérieur pour stocker du bois',
    source: 'Formulaire',
    typeLogement: 'maison_individuelle',
    usage: 'heatingAndHotWater',
  },
  {
    label: 'Pompe à chaleur air-air individuelle',
    overrides: { espaceExterieur: 'none', modeEauChaudeSanitaire: 'Individuel' },
    reason: 'Vous ne disposez pas d’espace extérieur pour installer l’unité extérieure de la PAC',
    source: 'Formulaire',
    typeLogement: 'maison_individuelle',
    usage: 'heatingAndHotWater',
  },
];

describe('modesDeChauffage', () => {
  it('has an estPossible test case for every heating mode', () => {
    const allHeatingModeKeys = TYPE_LOGEMENT_VALUES.flatMap((typeLogement) =>
      modesDeChauffage[typeLogement].map((modeDeChauffage) =>
        getModeKey({
          label: modeDeChauffage.label,
          typeLogement,
          usage: modeDeChauffage.usage,
        })
      )
    );

    expect(heatingModeCases.map(getModeKey)).toStrictEqual(allHeatingModeKeys);
  });

  it.each(heatingModeCases)('$typeLogement / $label / $usage is possible in its nominal situation', (testCase) => {
    const heatingMode = getMode(testCase.typeLogement, testCase.label, testCase.usage);

    expect(heatingMode.estPossible(createSituation(testCase.possibleOverrides))).toStrictEqual(true);
  });

  it.each(heatingModeCases)('$typeLogement / $label / $usage has no incompatibility in its nominal situation', (testCase) => {
    const heatingMode = getMode(testCase.typeLogement, testCase.label, testCase.usage);
    const incompatibleRules = heatingMode.incompatibilites ?? [];

    expect(incompatibleRules.filter((rule) => rule.isIncompatible(createSituation(testCase.possibleOverrides)))).toStrictEqual([]);
  });

  describe('estPossible negative cases', () => {
    heatingModeCases.forEach((testCase) => {
      describe(getModeKey(testCase), () => {
        testCase.impossibleCases.forEach((impossibleCase) => {
          it(`returns false ${impossibleCase.description}`, () => {
            const heatingMode = getMode(testCase.typeLogement, testCase.label, testCase.usage);

            expect(heatingMode.estPossible(createSituation(impossibleCase.overrides))).toStrictEqual(false);
          });
        });
      });
    });
  });

  describe('estPossible additional positive cases', () => {
    heatingModeCases.forEach((testCase) => {
      testCase.additionalPossibleCases?.forEach((possibleCase) => {
        it(`${getModeKey(testCase)} returns true ${possibleCase.description}`, () => {
          const heatingMode = getMode(testCase.typeLogement, testCase.label, testCase.usage);

          expect(heatingMode.estPossible(createSituation(possibleCase.overrides))).toStrictEqual(true);
        });
      });
    });
  });

  it('has an incompatibility test case for every declared incompatibility rule', () => {
    const allIncompatibilityKeys = TYPE_LOGEMENT_VALUES.flatMap((typeLogement) =>
      modesDeChauffage[typeLogement].flatMap((modeDeChauffage) =>
        (modeDeChauffage.incompatibilites ?? []).map(
          (rule) => `${typeLogement} / ${modeDeChauffage.label} / ${modeDeChauffage.usage} / ${rule.reason}`
        )
      )
    );
    const testedIncompatibilityKeys = incompatibilityCases.map(
      (testCase) => `${testCase.typeLogement} / ${testCase.label} / ${testCase.usage} / ${testCase.reason}`
    );

    expect(testedIncompatibilityKeys).toStrictEqual(allIncompatibilityKeys);
  });

  it.each(incompatibilityCases)('$typeLogement / $label / $usage returns the expected incompatibility for $reason', (testCase) => {
    const rows = getIncompatibleSolutionRows(createSituation(testCase.overrides), testCase.typeLogement);

    expect(rows).toContainEqual({
      label: testCase.label,
      reason: testCase.reason,
      source: testCase.source,
    });
  });

  it('does not return a solar thermal incompatibility when coverage equals the threshold', () => {
    const rows = getIncompatibleSolutionRows(
      createSituation({ modeEauChaudeSanitaire: 'Collectif', solarThermalCoverage: 80 }),
      'immeuble_chauffage_collectif'
    );

    expect(rows).not.toContainEqual({
      label: 'Solaire thermique',
      reason: 'La place disponible en toiture est insuffisante ou l’orientation n’est pas idéale.',
      source: 'Cerema',
    });
  });
});
