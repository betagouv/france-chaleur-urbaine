import type { ReactNode } from 'react';

import {
  type DPE,
  DPE_VALUES,
  type EspaceExterieur,
  type TypeLogement,
  type TypeRadiateur,
} from '@/modules/chaleur-renouvelable/constants';
import { getCoutRaccordementResidentiel, prettyPrintCout } from '@/modules/simulator/client/SimulateurCoutRaccordement';
import type { HeatNetwork } from '@/types/HeatNetworksResponse';

export type ModeDeChauffageUsage = 'heatingAndHotWater' | 'hotWaterOnly';

export type ModeDeChauffage = {
  label: string;
  usage: ModeDeChauffageUsage;
  icone: string;
  pertinence: number;
  description: string;
  contraintesTechniques: ReactNode[] | ((situation: Situation) => ReactNode[]);
  avantages: string[];
  inconvenients: string[];
  coutParAnPublicodeKey: string;
  coutInstallation?: string | ((situation: Situation) => string);
  gainClasse: number;
  gainVsGaz?: number;
  helpAction?: 'open-heat-network-contact';
  estPossible: (situation: Situation) => boolean;
  incompatibilites?: IncompatibleSolutionRule[];
  prerequis: (situation: Situation) => PrerequisiteRow[];
};

export type ModeDeChauffageEnriched = ModeDeChauffage & {
  coutParAn: number;
  coutInstallation: string;
  contraintesTechniques: ReactNode[];
};

export type Situation = {
  architecturalProtectionAc1: boolean;
  architecturalProtectionAc2: boolean;
  architecturalProtectionAc3: boolean;
  architecturalProtectionAc4: boolean;
  architecturalProtectionAc4bis: boolean;
  espaceExterieur: EspaceExterieur;
  planProtectionAtmosphere: boolean;
  geothermiePossible: boolean;
  dpe: DPE;
  adresse: string | null;
  nbLogements: number;
  surfaceMoyenne: number;
  habitantsMoyen: number;
  eligibiliteReseauChaleur: HeatNetwork | null;
  geothermalNappeGmi: number | null;
  geothermalNappePotential: number | null;
  geothermalSondeGmi: number | null;
  hasGeothermalProbeSpace: boolean | null;
  typeRadiateur: TypeRadiateur | null;
};

export type IncompatibleSolutionRow = {
  label: string;
  reason: string;
  source: string;
};

export type PrerequisiteStatus = 'favorable' | 'defavorable' | 'contraignant' | 'aVerifier';

export type PrerequisiteRow = {
  label: ReactNode;
  source?: string;
  status: PrerequisiteStatus;
};

type IncompatibleSolutionRule = {
  reason: string;
  source: string;
  isIncompatible: (situation: Situation) => boolean;
};

export const DPE_BG: Record<DPE, string> = {
  A: 'bg-[#00A06C]',
  B: 'bg-[#52B053]',
  C: 'bg-[#A6CB71]',
  D: 'bg-[#F5E70F]',
  E: 'bg-[#F0B50E]',
  F: 'bg-[#EC8136]',
  G: 'bg-[#D7211F]',
};

export function improveDpe(dpe: DPE, gainClasse: number): DPE {
  const currentIndex = DPE_VALUES.indexOf(dpe);
  const nextIndex = Math.max(0, currentIndex - Math.max(0, gainClasse));
  return DPE_VALUES[nextIndex];
}

const hasEspaceShared = (situation: Situation) => ['shared', 'both'].includes(situation.espaceExterieur);
const hasEspacePrivate = (situation: Situation) => ['private', 'both'].includes(situation.espaceExterieur);
const hasEspaceForHouseEquipment = (situation: Situation) => ['shared', 'both'].includes(situation.espaceExterieur);
const hasWaterRadiator = (situation: Situation) => situation.typeRadiateur === 'radiateur-eau';
const hasCompatibleGeothermalPotential = (situation: Situation) =>
  situation.geothermiePossible &&
  situation.geothermalNappeGmi !== 3 &&
  situation.geothermalSondeGmi !== 3 &&
  situation.geothermalNappePotential !== 5 &&
  situation.geothermalNappePotential !== 6 &&
  situation.hasGeothermalProbeSpace !== false;
const hasFavorableGeothermalArea = (situation: Situation) =>
  [1, 2].includes(situation.geothermalNappeGmi ?? 0) || [1, 2].includes(situation.geothermalSondeGmi ?? 0);
const hasSufficientGeothermalResource = (situation: Situation) => [7, 8, 9].includes(situation.geothermalNappePotential ?? 0);
const getPdpPrerequisite = (situation: Situation): PrerequisiteRow[] =>
  situation.eligibiliteReseauChaleur?.inPDP
    ? [
        {
          label:
            'Votre bâtiment est situé dans un Périmètre de développement prioritaire et soumis à une obligation d’étude du raccordement au réseau.',
          source: 'France Chaleur Urbaine',
          status: 'contraignant',
        },
      ]
    : [];
const architecturalProtectionPrerequisites = [
  ['architecturalProtectionAc1', 'Monuments historiques'],
  ['architecturalProtectionAc2', 'Sites inscrits et classés'],
  ['architecturalProtectionAc3', 'Réserves naturelles'],
  ['architecturalProtectionAc4', 'Sites patrimoniaux remarquables'],
  ['architecturalProtectionAc4bis', "Plans de valorisation de l'architecture et du patrimoine"],
] as const;
const getArchitecturalProtectionPrerequisites = (situation: Situation): PrerequisiteRow[] =>
  architecturalProtectionPrerequisites
    .filter(([key]) => situation[key])
    .map(([, label]) => ({
      label: `Votre bâtiment se trouve dans une zone architecturale « ${label} », ce qui peut présenter des contraintes d’intégration`,
      source: 'Cerema',
      status: 'contraignant',
    }));
const getPpaPrerequisite = (situation: Situation, source: string): PrerequisiteRow[] =>
  situation.planProtectionAtmosphere
    ? [
        {
          label: 'Votre bâtiment est situé dans une zone de protection de l’atmosphère',
          source,
          status: 'contraignant',
        },
      ]
    : [];
const getGeothermalPrerequisites = (situation: Situation): PrerequisiteRow[] => [
  ...(hasFavorableGeothermalArea(situation)
    ? [
        {
          label: 'Votre bâtiment est situé dans une zone favorable au forage',
          source: 'Cerema',
          status: 'favorable' as const,
        },
      ]
    : []),
  ...(hasSufficientGeothermalResource(situation)
    ? [
        {
          label: 'La ressource énergétique de la parcelle est suffisante',
          source: 'Cerema',
          status: 'favorable' as const,
        },
      ]
    : []),
  ...(situation.hasGeothermalProbeSpace
    ? [
        {
          label: 'Place suffisante pour l’implantation de sondes géothermiques',
          source: 'Cerema',
          status: 'favorable' as const,
        },
      ]
    : []),
];
const outdoorPacPrerequisites = [
  { label: 'Espace requis pour les modules extérieurs', status: 'aVerifier' },
  {
    label: 'Réglementation acoustique : le bruit ne doit pas dépasser les seuils du Code de la santé publique',
    status: 'aVerifier',
  },
] satisfies PrerequisiteRow[];

export const modeDeChauffageParTypeLogement: Record<TypeLogement, ModeDeChauffage[]> = {
  immeuble_chauffage_collectif: [
    {
      avantages: ['Faibles émissions de CO₂', 'Prix stables', 'TVA réduite à 5,5 %', "Garantie d'un service public"],
      contraintesTechniques: (situation: Situation) =>
        [
          <>
            Proximité à un réseau : <strong>{situation.eligibiliteReseauChaleur?.distance}</strong> m à vol d’oiseau
          </>,
          situation.eligibiliteReseauChaleur?.inPDP && <>Votre bâtiment est situé dans une zone de développement prioritaire</>,
          'Seuil de puissance requis : à vérifier',
          'Local pour la sous-station : à vérifier',
        ].filter(Boolean),
      coutInstallation: (situation: Situation) => {
        const result = getCoutRaccordementResidentiel(situation.nbLogements);
        if (Array.isArray(result)) {
          const [lowerBoundString, upperBoundString] = result;
          return `${prettyPrintCout(lowerBoundString / situation.nbLogements)} à ${prettyPrintCout(upperBoundString / situation.nbLogements)}`;
        }
        return 'Inconnu';
      },
      coutParAnPublicodeKey: 'Réseaux de chaleur',
      description:
        "Le réseau de chaleur (ou chauffage urbain) distribue de la chaleur produite de façon centralisée à un ensemble de bâtiments, via des canalisations souterraines. Ces réseaux sont alimentés en majorité par des énergies renouvelables et de récupération locales. C'est la solution à privilégier pour un chauffage collectif lorsqu'elle est disponible.",
      estPossible: (situation) => situation.eligibiliteReseauChaleur?.isEligible ?? false,
      gainClasse: 1,
      helpAction: 'open-heat-network-contact',
      icone: 'img/icon-rcu.webp',
      incompatibilites: [
        {
          isIncompatible: (situation) => (situation.eligibiliteReseauChaleur?.distance ?? 0) > 200,
          reason: 'Votre bâtiment est trop éloigné d’un réseau de chaleur',
          source: 'France Chaleur Urbaine',
        },
      ],
      inconvenients: ['Long contrat (15-20 ans)'],
      label: 'Réseau de chaleur',
      pertinence: 4,
      prerequis: (situation) => [
        {
          label: 'Chauffage collectif et radiateurs à eau',
          source: 'Formulaire',
          status: 'favorable',
        },
        {
          label: 'Distance au réseau de chaleur < 200 m',
          source: 'France Chaleur Urbaine',
          status: 'favorable',
        },
        ...getPdpPrerequisite(situation),
      ],
      usage: 'heatingAndHotWater',
    },
    {
      avantages: [
        'Faibles émissions de CO₂',
        'Suppression des chaudières (gain de place, sécurité)',
        'Possibilité de couvrir les besoins en froid si associé à des ventilo-convecteurs',
      ],
      contraintesTechniques: [
        'Isolation globale recommandée au préalable pour éviter des performances dégradées',
        'Surface extérieure pour le forage',
        'Local technique',
      ],
      coutInstallation: '8000 à 11 000 €',
      coutParAnPublicodeKey: 'PAC eau-eau coll',
      description:
        "La pompe à chaleur géothermique (eau-eau) capte les calories du sous-sol (sol ou nappe phréatique) et les transfère à un circuit d'eau chaude pour assurer le chauffage et l'eau chaude sanitaire. Elle est très efficace et écologique, idéale si l'espace extérieur permet un forage. Cette solution nécessite un bâtiment bien isolé ou équipé de planchers chauffants pour être performante.",
      estPossible: (situation) => hasEspaceShared(situation) && hasCompatibleGeothermalPotential(situation),
      gainClasse: 2,
      icone: 'img/icon-pac.webp',
      incompatibilites: [
        {
          isIncompatible: (situation) => !hasEspaceShared(situation),
          reason: 'Vous ne disposez pas d’espace extérieur pour disposer les sondes',
          source: 'Formulaire',
        },
        {
          isIncompatible: (situation) => situation.geothermalNappeGmi === 3 || situation.geothermalSondeGmi === 3,
          reason: 'Votre bâtiment est situé dans une zone défavorable au forage',
          source: 'Cerema',
        },
        {
          isIncompatible: (situation) => situation.geothermalNappePotential === 5 || situation.geothermalNappePotential === 6,
          reason: 'La ressource énergétique de la parcelle est insuffisante',
          source: 'Cerema',
        },
        {
          isIncompatible: (situation) => situation.hasGeothermalProbeSpace === false,
          reason: 'Place insuffisante pour l’implantation de sondes géothermiques',
          source: 'Cerema',
        },
      ],
      inconvenients: ['Investissement initial important', 'Travaux d’installation conséquents'],
      label: 'Pompe à chaleur géothermique',
      pertinence: 3,
      prerequis: (situation) => [
        {
          label: 'Chauffage collectif et radiateurs à eau',
          source: 'Formulaire',
          status: 'favorable',
        },
        ...getPdpPrerequisite(situation),
        ...getGeothermalPrerequisites(situation),
        {
          label: 'Espace requis en local technique',
          status: 'aVerifier',
        },
        {
          label: 'Accessibilité de la parcelle pour les machines de forage',
          status: 'aVerifier',
        },
      ],
      usage: 'heatingAndHotWater',
    },
    {
      avantages: ['Faibles émissions de CO₂', 'Longévité des équipements'],
      contraintesTechniques: [
        'Espace conséquent (chaudière et stockage)',
        'Approvisionnement local disponible',
        'Déconseillé en zone sensible pour la qualité de l’air (commune avec PPA)',
      ],
      coutInstallation: '6 000 à 8 000 €',
      coutParAnPublicodeKey: 'Chaudière à granulés coll',
      description:
        "La chaudière biomasse fonctionne comme une chaudière gaz ou fioul, mais utilise du bois comme combustible (granulés, plaquettes, bûches). C'est une énergie renouvelable et locale. Cette solution nécessite un espace conséquent pour la chaudière et le stockage du combustible, ainsi qu'un approvisionnement régulier.",
      estPossible: (situation) => hasEspaceShared(situation) && situation.planProtectionAtmosphere === false,
      gainClasse: 2,
      icone: 'img/icon-biomasse.webp',
      incompatibilites: [
        {
          isIncompatible: (situation) => !hasEspaceShared(situation),
          reason: 'Vous ne disposez pas d’espace extérieur pour le stockage de combustible',
          source: 'Formulaire',
        },
      ],
      inconvenients: ['Investissement initial important', 'Approvisionnement à prévoir', 'Maintenance à assurer'],
      label: 'Chaudière biomasse',
      pertinence: 3,
      prerequis: (situation) => [
        ...getPdpPrerequisite(situation),
        {
          label: 'Chauffage collectif et radiateurs à eau',
          source: 'Formulaire',
          status: 'favorable',
        },
        ...(situation.planProtectionAtmosphere
          ? [
              {
                label: 'Votre bâtiment est situé dans une zone de protection de l’atmosphère',
                source: 'France Chaleur Urbaine',
                status: 'contraignant' as const,
              },
            ]
          : []),
        ...getArchitecturalProtectionPrerequisites(situation),
        {
          label: 'Espace requis en local technique pour la chaudière et le stockage de combustible',
          status: 'aVerifier',
        },
        {
          label: 'Accessibilité de la parcelle pour la livraison du combustible',
          status: 'aVerifier',
        },
      ],
      usage: 'heatingAndHotWater',
    },
    {
      avantages: [
        'Faibles émissions de CO₂',
        'Économique si bien dimensionnée',
        'Suppression des chaudières (gain de place, sécurité)',
        'Possibilité de couvrir les besoins en froid si associée à des ventilo-convecteurs',
      ],
      contraintesTechniques: [
        'Isolation globale nécessaire au préalable pour éviter des performances dégradées (chauffage peu efficace et onéreux)',
        'Espace extérieur accessible pour la maintenance',
        'Local technique',
      ],
      coutInstallation: '4 000 à 6 000 €',
      coutParAnPublicodeKey: 'PAC air-eau coll',
      description:
        "La pompe à chaleur air/eau capte les calories de l'air extérieur et les transfère à un circuit d’eau chaude pour assurer le chauffage et l’eau chaude sanitaire de votre logement.",
      estPossible: (situation) => hasEspaceShared(situation),
      gainClasse: 2,
      icone: 'img/icon-pac.webp',
      incompatibilites: [
        {
          isIncompatible: (situation) => !hasEspaceShared(situation),
          reason: 'Vous ne disposez pas d’espace extérieur pour disposer l’unité extérieure',
          source: 'Formulaire',
        },
      ],
      inconvenients: ['Nuisances sonores', 'Impact esthétique des modules extérieurs'],
      label: 'Pompe à chaleur air-eau collective',
      pertinence: 2,
      prerequis: (situation) => [
        {
          label: 'Chauffage collectif et radiateurs à eau',
          source: 'Formulaire',
          status: 'favorable',
        },
        ...getPdpPrerequisite(situation),
        ...getArchitecturalProtectionPrerequisites(situation),
        { label: 'Espace requis en local technique', status: 'aVerifier' },
        ...outdoorPacPrerequisites,
        {
          label: "Raccordement électrique du bâtiment adapté à la puissance de l'équipement",
          status: 'aVerifier',
        },
      ],
      usage: 'heatingAndHotWater',
    },
    {
      avantages: ['Facilité d’implémentation', 'Espace extérieur accessible pour la maintenance'],
      contraintesTechniques: [
        'Emplacement pour l’unité extérieure (autorisation requise)',
        'Isolation globale nécessaire au préalable pour éviter des performances dégradées (chauffage peu efficace et onéreux)',
        'N’assure pas la production d’eau chaude sanitaire',
        'Peu conseillé en climat rigoureux (performances réduites)',
      ],
      coutInstallation: '3 000 à 5 000 €',
      coutParAnPublicodeKey: 'PAC air-eau coll hybride',
      description:
        "La pompe à chaleur air/eau combinée à une chaudière gaz est une solution facile à mettre en place : elle permet d’installer une pompe à chaleur moins puissante tout en réduisant les émissions de CO₂.  La pompe à chaleur capte les calories de l'air extérieur et les transfère à un circuit d’eau chaude pour assurer le chauffage et l’eau chaude sanitaire de votre logement.",
      estPossible: (situation) => hasEspaceShared(situation),
      gainClasse: 1,
      icone: 'img/icon-pac.webp',
      incompatibilites: [
        {
          isIncompatible: (situation) => !hasEspaceShared(situation),
          reason: 'Vous ne disposez pas d’espace extérieur pour disposer l’unité extérieure',
          source: 'Formulaire',
        },
      ],
      inconvenients: ['Nuisances sonores', 'Impact esthétique des modules extérieurs'],
      label: 'Hybride : PAC air/eau collective et chaudière gaz',
      pertinence: 1,
      prerequis: (situation) => [
        {
          label: 'Chauffage collectif et radiateurs à eau',
          source: 'Formulaire',
          status: 'favorable',
        },
        ...getPdpPrerequisite(situation),
        ...getArchitecturalProtectionPrerequisites(situation),
        { label: 'Espace requis en local technique', status: 'aVerifier' },
        ...outdoorPacPrerequisites,
        {
          label: "Raccordement électrique du bâtiment adapté à la puissance de l'équipement",
          status: 'aVerifier',
        },
      ],
      usage: 'heatingAndHotWater',
    },
    {
      avantages: [
        'Aucune émission de CO₂ en fonctionnement',
        "Coût de la chaleur compétitif une fois l'installation amortie",
        'Technologie fiable et mature — durée de vie 20-25 ans',
      ],
      contraintesTechniques: [
        'Toiture bien exposée — orientation sud à sud-ouest, inclinaison 30-60°, sans ombrage',
        'Espace requis — environ 2 m² de capteurs par logement + local technique pour le ballon de stockage',
        "Autorisation d'urbanisme possible — consultation des ABF requise en zone protégée",
      ],
      coutInstallation: '2 000 à 3 000 €',
      coutParAnPublicodeKey: 'Solaire thermique',
      description:
        "Les capteurs solaires captent le rayonnement solaire et réchauffent un fluide caloporteur, qui transmet ensuite la chaleur à un ballon d’eau chaude via un échangeur. Le solaire thermique est une solution fiable et mature pour produire une part importante de l'eau chaude sanitaire. Idéal pour les toitures terrasses. Le solaire thermique est une solution à combiner avec un système de chauffage complémentaire qui prend le relai en période de faible ensoleillement.",
      estPossible: (situation) => hasEspaceShared(situation),
      gainClasse: 1,
      gainVsGaz: -50,
      icone: 'img/icon-solaire.webp',
      inconvenients: [
        'Investissement initial important',
        "Ne couvre que l'eau chaude sanitaire — nécessite un système d'appoint pour le chauffage",
      ],
      label: 'Solaire thermique (eau chaude seulement)',
      pertinence: 3,
      prerequis: () => [
        { label: 'Toiture bien exposée — orientation sud à sud-ouest, inclinaison 30-60°, sans ombrage', status: 'aVerifier' },
        {
          label: 'Espace requis — environ 2 m² de capteurs par logement + local technique pour le ballon de stockage',
          status: 'aVerifier',
        },
        { label: "Autorisation d'urbanisme possible — consultation des ABF requise en zone protégée", status: 'aVerifier' },
      ],
      usage: 'hotWaterOnly',
    },
  ],
  immeuble_chauffage_individuel: [
    {
      avantages: [
        'Faibles émissions de CO₂',
        'Économique si bien dimensionnée',
        'Suppression des chaudières (gain de place, sécurité)',
        'Possibilité de couvrir les besoins en froid si associée à des ventilo-convecteurs',
      ],
      contraintesTechniques: [
        'Isolation globale recommandée au préalable pour éviter des performances dégradées',
        'Espace extérieur pour l’unité extérieure',
        'Local technique',
      ],
      coutInstallation: '7 000 à 10 000 €',
      coutParAnPublicodeKey: 'PAC air-eau indiv',
      description:
        "La pompe à chaleur air/eau capte les calories de l'air extérieur et les transfère à un circuit d’eau chaude pour assurer le chauffage et l’eau chaude sanitaire de votre logement.",
      estPossible: (situation) => hasEspacePrivate(situation) && situation.typeRadiateur !== 'radiateur-electrique',
      gainClasse: 1,
      icone: 'img/icon-pac.webp',
      incompatibilites: [
        {
          isIncompatible: (situation) => !hasEspacePrivate(situation),
          reason: 'Vous ne disposez pas d’espace extérieur pour installer l’unité extérieure',
          source: 'Formulaire',
        },
        {
          isIncompatible: (situation) => situation.typeRadiateur === 'radiateur-electrique',
          reason: 'Vous ne disposez pas de radiateur à eau',
          source: 'Formulaire',
        },
      ],
      inconvenients: ['Nuisances sonores', 'Impact esthétique des modules extérieurs'],
      label: 'Pompe à chaleur air-eau individuelle (appartement)',
      pertinence: 3,
      prerequis: (situation) => [
        {
          label: 'Chauffage individuel et radiateurs à eau',
          source: 'Formulaire',
          status: 'favorable',
        },
        ...getArchitecturalProtectionPrerequisites(situation),
        { label: 'Règlementation de la copro autorisant la pose d’unités extérieures sur les balcons', status: 'aVerifier' },
        ...outdoorPacPrerequisites,
        {
          label: "Raccordement électrique de l’appartement adapté à la puissance de l'équipement",
          status: 'aVerifier',
        },
      ],
      usage: 'heatingAndHotWater',
    },
    {
      avantages: ['Faibles émissions de CO₂', 'Possibilité de couvrir les besoins en froid'],
      contraintesTechniques: [
        'Emplacement pour l’unité extérieure',
        'Isolation globale recommandée au préalable pour éviter des performances dégradées',
        'N’assure pas la production d’eau chaude sanitaire',
      ],
      coutInstallation: '3 000 à 5 000 €',
      coutParAnPublicodeKey: 'PAC air-air indiv',
      description:
        "La pompe à chaleur air/air capte les calories de l'air extérieur et les restitue à l’intérieur en diffusant de l’air chaud.",
      estPossible: (situation) => hasEspacePrivate(situation) && !hasWaterRadiator(situation),
      gainClasse: 2,
      icone: 'img/icon-pac.webp',
      incompatibilites: [
        {
          isIncompatible: (situation) => !hasEspacePrivate(situation),
          reason: 'Vous ne disposez pas d’espace extérieur pour installer l’unité extérieure',
          source: 'Formulaire',
        },
        {
          isIncompatible: (situation) => hasWaterRadiator(situation),
          reason: 'Vous disposez de radiateurs à eau qui pourraient être mieux valorisés',
          source: 'Formulaire',
        },
      ],
      inconvenients: ['Faible confort thermique (air soufflé)', 'Nuisances sonores', 'Impact esthétique des modules extérieurs'],
      label: 'Pompe à chaleur air-air individuelle (appartement)',
      pertinence: 1,
      prerequis: (situation) => [
        {
          label: 'Chauffage individuel et radiateurs électriques',
          source: 'Formulaire',
          status: 'favorable',
        },
        ...getArchitecturalProtectionPrerequisites(situation),
        { label: 'Règlementation de la copro autorisant la pose d’unités extérieures sur les balcons', status: 'aVerifier' },
        ...outdoorPacPrerequisites,
        {
          label: "Raccordement électrique de l’appartement adapté à la puissance de l'équipement",
          status: 'aVerifier',
        },
      ],
      usage: 'heatingAndHotWater',
    },
  ],
  maison_individuelle: [
    {
      avantages: [
        'Faibles émissions de CO2',
        'Suppression des chaudières (gain de place, sécurité)',
        'Possibilité de couvrir les besoins en froid si associé à des ventilo-convecteurs',
      ],
      contraintesTechniques: [
        'Isolation globale recommandée au préalable pour éviter des performances dégradées',
        'Surface extérieure pour le forage',
        'Local technique',
      ],
      coutInstallation: '20 000 à 25 000 €',
      coutParAnPublicodeKey: 'PAC eau-eau indiv',
      description:
        "La pompe à chaleur géothermique (eau-eau) capte les calories du sous-sol (sol ou nappe phréatique) et les transfère à un circuit d'eau chaude pour assurer le chauffage et l'eau chaude sanitaire. Elle est très efficace et écologique, idéale si l'espace extérieur permet un forage. Cette solution nécessite une maison bien isolé ou équipé de planchers chauffants pour être performante.",
      estPossible: (situation) =>
        hasEspaceForHouseEquipment(situation) &&
        hasCompatibleGeothermalPotential(situation) &&
        situation.typeRadiateur !== 'radiateur-electrique',
      gainClasse: 2,
      icone: 'img/icon-geothermie.webp',
      incompatibilites: [
        {
          isIncompatible: (situation) => !hasEspaceForHouseEquipment(situation),
          reason: 'Vous ne disposez pas d’espace extérieur pour disposer les sondes',
          source: 'Formulaire',
        },
        {
          isIncompatible: (situation) => situation.geothermalNappeGmi === 3 || situation.geothermalSondeGmi === 3,
          reason: 'Votre bâtiment est situé dans une zone défavorable au forage',
          source: 'Cerema',
        },
        {
          isIncompatible: (situation) => situation.geothermalNappePotential === 5 || situation.geothermalNappePotential === 6,
          reason: 'La ressource énergétique de la parcelle est insuffisante',
          source: 'Cerema',
        },
        {
          isIncompatible: (situation) => situation.hasGeothermalProbeSpace === false,
          reason: 'Place insuffisante pour l’implantation de sondes géothermiques',
          source: 'Cerema',
        },
        {
          isIncompatible: (situation) => situation.typeRadiateur === 'radiateur-electrique',
          reason: 'Vous ne disposez pas de radiateur à eau',
          source: 'Formulaire',
        },
      ],
      inconvenients: ['Investissement initial important', 'Travaux d’installation conséquents'],
      label: 'Pompe à chaleur géothermique (maison)',
      pertinence: 3,
      prerequis: (situation) => [
        {
          label: 'Maison à chauffage individuel et radiateurs à eau',
          source: 'Formulaire',
          status: 'favorable',
        },
        ...getGeothermalPrerequisites(situation),
        { label: 'Accessibilité de la parcelle pour les machines de forage', status: 'aVerifier' },
      ],
      usage: 'heatingAndHotWater',
    },
    {
      avantages: ['Faibles émissions de CO2', 'Longévité des équipements'],
      contraintesTechniques: [
        'Espace conséquent (chaudière et stockage)',
        'Approvisionnement local disponible',
        'Déconseillé en zone sensible pour la qualité de l’air (commune avec PPA)',
      ],
      coutInstallation: '10 000 à 17 000 €',
      coutParAnPublicodeKey: 'PAC eau-eau indiv',
      description:
        "La chaudière biomasse fonctionne comme une chaudière gaz ou fioul, mais utilise du bois comme combustible (granulés, plaquettes, bûches). C'est une énergie renouvelable et locale. Cette solution nécessite un espace pour la chaudière et le stockage du combustible, ainsi qu'un approvisionnement régulier.",
      estPossible: (situation) =>
        hasEspaceForHouseEquipment(situation) &&
        situation.planProtectionAtmosphere !== false &&
        situation.typeRadiateur !== 'radiateur-electrique',
      gainClasse: 2,
      icone: 'img/icon-biomasse.webp',
      incompatibilites: [
        {
          isIncompatible: (situation) => !hasEspaceForHouseEquipment(situation),
          reason: 'Vous ne disposez pas d’espace extérieur pour le stockage de combustible',
          source: 'Formulaire',
        },
        {
          isIncompatible: (situation) => situation.typeRadiateur === 'radiateur-electrique',
          reason: 'Vous ne disposez pas de radiateur à eau',
          source: 'Formulaire',
        },
      ],
      inconvenients: ['Investissement initial important', 'Approvisionnement à prévoir', 'Maintenance à assurer'],
      label: 'Chaudière biomasse (maison)',
      pertinence: 2,
      prerequis: (situation) => [
        {
          label: 'Maison à chauffage individuel et radiateurs à eau',
          source: 'Formulaire',
          status: 'favorable',
        },
        ...getPpaPrerequisite(situation, 'Cerema'),
        ...getArchitecturalProtectionPrerequisites(situation),
        { label: 'Espace requis en local technique pour la chaudière et le stockage', status: 'aVerifier' },
        { label: 'Accessibilité de la parcelle pour la livraison du combustible', status: 'aVerifier' },
      ],
      usage: 'heatingAndHotWater',
    },
    {
      avantages: [
        'Isolation globale recommandée au préalable pour éviter des performances dégradées (chauffage peu efficace et onéreux)',
        'Espace extérieur accessible pour la maintenance',
        'Local technique',
      ],
      contraintesTechniques: ['Nuisances sonores', 'Impact esthétique des modules extérieurs'],
      coutInstallation: '12 000 à 15 000 €',
      coutParAnPublicodeKey: 'PAC air-eau indiv',
      description:
        "La pompe à chaleur air/eau capte les calories de l'air extérieur et les transfère à un circuit d’eau chaude pour assurer le chauffage et l’eau chaude sanitaire de votre logement.",
      estPossible: (situation) => situation.espaceExterieur !== 'none' && situation.typeRadiateur !== 'radiateur-electrique',
      gainClasse: 2,
      icone: 'img/icon-pac.webp',
      incompatibilites: [
        {
          isIncompatible: (situation) => situation.espaceExterieur === 'none',
          reason: 'Vous ne disposez pas d’espace extérieur pour disposer l’unité extérieure de la PAC',
          source: 'Formulaire',
        },
        {
          isIncompatible: (situation) => situation.typeRadiateur === 'radiateur-electrique',
          reason: 'Vous ne disposez pas de radiateur à eau',
          source: 'Formulaire',
        },
      ],
      inconvenients: [
        'Faibles émissions de CO₂',
        'Économique si bien dimensionnée',
        'Suppression des chaudières (gain de place, sécurité)',
        'Possibilité de couvrir les besoins en froid si associée à des ventilo-convecteurs',
      ],
      label: 'Pompe à chaleur air-eau individuelle (maison)',
      pertinence: 2,
      prerequis: (situation) => [
        {
          label: 'Maison à chauffage individuel et radiateurs à eau',
          source: 'Formulaire',
          status: 'favorable',
        },
        ...getArchitecturalProtectionPrerequisites(situation),
        ...outdoorPacPrerequisites,
        {
          label: "Raccordement électrique de la maison adapté à la puissance de l'équipement",
          status: 'aVerifier',
        },
      ],
      usage: 'heatingAndHotWater',
    },
    {
      avantages: ['Faibles émissions de CO₂', 'Coût de la chaleur compétitif', 'Longévité des équipements'],
      contraintesTechniques: ['Conduit de fumée requis', 'Espace de stockage pour le combustible', 'Déconseillé en zone PPA'],
      coutInstallation: '4 000 à 6 000 €',
      coutParAnPublicodeKey: 'Poêle à granulés indiv',
      description:
        "Le poêle est un appareil indépendant qui utilise du bois comme combustible, généralement sous forme de bûches ou de granulés (pellets). Il chauffe principalement la pièce où il est installé. C'est une solution économique à l'usage et écologique, particulièrement adaptée aux maisons individuelles disposant d'un conduit de fumée.",
      estPossible: (situation) =>
        situation.espaceExterieur !== 'none' && situation.planProtectionAtmosphere !== false && !hasWaterRadiator(situation),
      gainClasse: 1,
      icone: 'img/icon-biomasse.webp',
      incompatibilites: [
        {
          isIncompatible: (situation) => hasWaterRadiator(situation),
          reason: 'Vous disposez de radiateurs à eau qui ne sont pas nécessaires pour cet appareil',
          source: 'Formulaire',
        },
        {
          isIncompatible: (situation) => situation.espaceExterieur === 'none',
          reason: 'Vous ne disposez pas d’espace extérieur pour stocker du bois',
          source: 'Formulaire',
        },
      ],
      inconvenients: ["Ne chauffe qu'une seule pièce", 'Approvisionnement à prévoir'],
      label: 'Poêle à buche ou à granulés ',
      pertinence: 3,
      prerequis: (situation) => [
        {
          label: 'Maison à chauffage individuel et radiateurs électriques',
          source: 'Formulaire',
          status: 'favorable',
        },
        ...getPpaPrerequisite(situation, 'Cerema'),
        { label: 'Accessibilité de la parcelle pour la livraison du combustible', status: 'aVerifier' },
      ],
      usage: 'heatingAndHotWater',
    },
    {
      avantages: ['Faibles émissions de CO₂', 'Possibilité de rafraîchissement en été', "Coût d'installation modéré"],
      contraintesTechniques: [
        "Espace extérieur pour l'unité extérieure",
        'Isolation globale recommandée au préalable',
        'Autorisation de la copropriété généralement requise',
      ],
      coutInstallation: '6 000 à 8 000 €',
      coutParAnPublicodeKey: 'PAC air-air indiv',
      description:
        "La pompe à chaleur air/air capte les calories de l'air extérieur et les restitue à l'intérieur en diffusant de l'air chaud. Elle peut remplacer des radiateurs électriques. Cette solution permet également de rafraîchir le logement en été. Elle ne produit pas d'eau chaude sanitaire : un autre système est nécessaire pour l'ECS.",
      estPossible: (situation) => situation.espaceExterieur !== 'none' && !hasWaterRadiator(situation),
      gainClasse: 1,
      icone: 'img/icon-pac.webp',
      incompatibilites: [
        {
          isIncompatible: (situation) => situation.espaceExterieur === 'none',
          reason: 'Vous ne disposez pas d’espace extérieur pour installer l’unité extérieure de la PAC',
          source: 'Formulaire',
        },
        {
          isIncompatible: (situation) => hasWaterRadiator(situation),
          reason: 'Vous disposez de radiateurs à eau qui pourraient être mieux valorisés',
          source: 'Formulaire',
        },
      ],
      inconvenients: [
        'Confort thermique limité (air soufflé)',
        "Nuisances sonores de l'unité extérieure",
        "Ne produit pas l'eau chaude sanitaire",
      ],
      label: 'Pompe à chaleur air-air individuelle (maison)',
      pertinence: 1,
      prerequis: (situation) => [
        {
          label: 'Chauffage individuel et radiateurs électriques',
          source: 'Formulaire',
          status: 'favorable',
        },
        ...getArchitecturalProtectionPrerequisites(situation),
        ...outdoorPacPrerequisites,
        {
          label: "Raccordement électrique de la maison adapté à la puissance de l'équipement",
          status: 'aVerifier',
        },
      ],
      usage: 'heatingAndHotWater',
    },
    {
      avantages: ['Faibles émissions de CO₂', 'Coût de la chaleur compétitif', 'Longévité des équipements'],
      contraintesTechniques: ['Toiture sans masque et bien orientée', 'Local technique requis', "Système d'appoint obligatoire"],
      coutInstallation: '20 000 à 25 000 €',
      coutParAnPublicodeKey: 'Système solaire combiné',
      description:
        "Le système solaire combiné (SSC) produit à la fois le chauffage et l'eau chaude sanitaire à partir de panneaux solaires thermiques, généralement installés sur le toit. Ce système doit être associé à un appoint (gaz, bois ou électricité) qui prend le relais en période de faible ensoleillement.",
      estPossible: () => true,
      gainClasse: 2,
      gainVsGaz: -50,
      icone: 'img/icon-solaire.webp',
      inconvenients: ['Investissement initial important', "Production dépendante de l'ensoleillement"],
      label: 'Système solaire combiné ',
      pertinence: 3,
      prerequis: (situation) => [
        {
          label: 'Maison à chauffage individuel et radiateurs à eau',
          source: 'Formulaire',
          status: 'favorable',
        },
        ...getArchitecturalProtectionPrerequisites(situation),
        { label: 'Espace requis en local technique pour les ballons de stockage', status: 'aVerifier' },
        { label: 'Espace requis sur la toiture pour les capteurs', status: 'aVerifier' },
      ],
      usage: 'heatingAndHotWater',
    },
  ],
};

export function getIncompatibleSolutionRows(situation: Situation, typeLogement: TypeLogement): IncompatibleSolutionRow[] {
  return modeDeChauffageParTypeLogement[typeLogement].flatMap((mode) =>
    (mode.incompatibilites ?? [])
      .filter((incompatibilite) => incompatibilite.isIncompatible(situation))
      .map(({ reason, source }) => ({
        label: mode.label,
        reason,
        source,
      }))
  );
}
