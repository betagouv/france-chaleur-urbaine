import type { ReactNode } from 'react';

import {
  type DPE,
  DPE_VALUES,
  type EspaceExterieur,
  type ModeEauChaudeSanitaire,
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
  modeEauChaudeSanitaire: ModeEauChaudeSanitaire | null;
  solarThermalCoverage: number | null;
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
const hasCompatibleHotWaterMode = (situation: Situation, modes: ModeEauChaudeSanitaire[]) =>
  !situation.modeEauChaudeSanitaire || modes.includes(situation.modeEauChaudeSanitaire);
const hasCompatibleRadiator = (situation: Situation, radiators: TypeRadiateur[]) =>
  situation.typeRadiateur ? radiators.includes(situation.typeRadiateur) : false;
const hasAnyOutdoorSpace = (situation: Situation) => situation.espaceExterieur !== 'none';
const hasCollectiveOutdoorEquipmentSpace = (situation: Situation) => hasEspaceShared(situation);
const hasIndividualOutdoorEquipmentSpace = (situation: Situation) => hasEspacePrivate(situation);
const hasCollectiveHotWaterMode = (situation: Situation) => hasCompatibleHotWaterMode(situation, ['Collectif']);
const hasIndividualHotWaterMode = (situation: Situation) => hasCompatibleHotWaterMode(situation, ['Individuel']);
const hasAnyHotWaterMode = (situation: Situation) => hasCompatibleHotWaterMode(situation, ['Collectif', 'Individuel']);
const hasWaterHeatingEmitter = (situation: Situation) => hasCompatibleRadiator(situation, ['radiateur-eau']);
const hasElectricOrOtherHeatingEmitter = (situation: Situation) => hasCompatibleRadiator(situation, ['radiateur-electrique', 'none']);
const hasCompatibleGeothermalPotential = (situation: Situation) =>
  situation.geothermiePossible &&
  hasFavorableGeothermalArea(situation) &&
  hasSufficientGeothermalResource(situation) &&
  situation.hasGeothermalProbeSpace !== false;
const HEAT_NETWORK_MAX_DISTANCE = 200;
const isNearHeatNetwork = (situation: Situation) =>
  (situation.eligibiliteReseauChaleur?.distance ?? Number.POSITIVE_INFINITY) < HEAT_NETWORK_MAX_DISTANCE;
const SOLAR_THERMAL_MIN_COVERAGE = 80;
const hasSufficientSolarThermalCoverage = (situation: Situation) =>
  (situation.solarThermalCoverage ?? Number.NEGATIVE_INFINITY) > SOLAR_THERMAL_MIN_COVERAGE;
const hasInsufficientSolarThermalCoverage = (situation: Situation) =>
  situation.solarThermalCoverage != null && situation.solarThermalCoverage < SOLAR_THERMAL_MIN_COVERAGE;
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
        "Votre bâtiment est à proximité d'un réseau de chaleur : c'est la solution à privilégier pour un chauffage collectif. Une énergie majoritairement renouvelable et locale, un prix stable et une TVA réduite à 5,5 %, le tout garanti par un service public.",
      estPossible: (situation) =>
        (situation.eligibiliteReseauChaleur?.isEligible ?? false) && isNearHeatNetwork(situation) && hasWaterHeatingEmitter(situation),
      gainClasse: 1,
      helpAction: 'open-heat-network-contact',
      icone: 'img/icon-rcu.webp',
      incompatibilites: [
        {
          isIncompatible: (situation) =>
            situation.eligibiliteReseauChaleur?.distance != null &&
            situation.eligibiliteReseauChaleur.distance >= HEAT_NETWORK_MAX_DISTANCE,
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
        'Aucune nuisance sonore',
      ],
      coutInstallation: '8000 à 11 000 €',
      coutParAnPublicodeKey: 'PAC eau-eau coll',
      description:
        "Votre bâtiment est situé en zone favorable à la géothermie. La pompe à chaleur géothermique capte la chaleur du sous-sol pour chauffer votre immeuble et produire du chauffage et de l'eau chaude : l'une des solutions les plus performantes et les plus sobres en CO₂. Cette solution est plus pertinente avec une rénovation globale ou un bâtiment récent, car c’est dans ces configurations qu’elle sera le plus efficace et donc le plus rentable.",
      estPossible: (situation) =>
        hasCollectiveOutdoorEquipmentSpace(situation) &&
        hasAnyHotWaterMode(situation) &&
        hasWaterHeatingEmitter(situation) &&
        hasCompatibleGeothermalPotential(situation),
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
      inconvenients: [
        'Investissement initial important',
        'Travaux importants dans les parties extérieures collectives pour le forage dans le sol',
      ],
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
      avantages: ['Faibles émissions de CO₂', 'Longévité des équipements', 'Coût de la chaleur compétitif', 'Énergie locale (bois)'],
      coutInstallation: '6 000 à 8 000 €',
      coutParAnPublicodeKey: 'Chaudière à granulés coll',
      description:
        'Votre bâtiment pourrait être adapté à l’installation d’une chaudière biomasse. Sous réserve d’espaces suffisamment importants et d’un approvisionnement local en bois disponible, cette solution vous permettrait de réduire les émissions CO₂ de votre bâtiment.',
      estPossible: (situation) =>
        hasCollectiveOutdoorEquipmentSpace(situation) && hasAnyHotWaterMode(situation) && hasWaterHeatingEmitter(situation),
      gainClasse: 2,
      icone: 'img/icon-biomasse.webp',
      incompatibilites: [
        {
          isIncompatible: (situation) => !hasEspaceShared(situation),
          reason: 'Vous ne disposez pas d’espace extérieur pour le stockage de combustible',
          source: 'Formulaire',
        },
      ],
      inconvenients: [
        'Investissement initial important',
        'Approvisionnement à prévoir (contrat de 3 ans minimum recommandé)',
        'Nuisance sonore modérée en fonctionnement, forte pendant les livraisons de combustible',
      ],
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
        'Suppression des chaudières (gain de place, sécurité)',
        'Rafraîchissement possible si émetteurs compatibles',
      ],
      coutInstallation: '4 000 à 6 000 €',
      coutParAnPublicodeKey: 'PAC air-eau coll',
      description:
        "Votre bâtiment semble disposer d’un espace extérieur pour accueillir une pompe à chaleur air/eau collective. Elle capte les calories de l'air extérieur pour chauffer votre immeuble et produire l'eau chaude, tout en supprimant vos chaudières. Cette solution est plus pertinente avec une rénovation globale ou un bâtiment récent, car c’est dans ces configurations qu’elle sera le plus efficace et donc le plus rentable.",
      estPossible: (situation) =>
        hasCollectiveOutdoorEquipmentSpace(situation) && hasAnyHotWaterMode(situation) && hasWaterHeatingEmitter(situation),
      gainClasse: 2,
      icone: 'img/icon-pac.webp',
      incompatibilites: [
        {
          isIncompatible: (situation) => !hasEspaceShared(situation),
          reason: 'Vous ne disposez pas d’espace extérieur pour disposer l’unité extérieure',
          source: 'Formulaire',
        },
      ],
      inconvenients: ['Étude acoustique nécessaire', 'Impact esthétique des modules extérieurs'],
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
      avantages: [
        'Faibles émissions de CO₂',
        'Optimisation du fonctionnement de la PAC',
        "Minimise l'investissement initial (PAC moins puissante)",
        'Rafraîchissement possible si émetteurs compatibles',
      ],
      coutInstallation: '3 000 à 5 000 €',
      coutParAnPublicodeKey: 'PAC air-eau coll hybride',
      description:
        "Votre bâtiment pourrait accueillir une solution hybride associant pompe à chaleur et chaudière gaz. La PAC couvre la majorité des besoins et la chaudière prend le relais les jours les plus froids : un bon compromis quand la PAC seule n'est pas possible.",
      estPossible: (situation) =>
        hasCollectiveOutdoorEquipmentSpace(situation) && hasAnyHotWaterMode(situation) && hasWaterHeatingEmitter(situation),
      gainClasse: 1,
      icone: 'img/icon-pac.webp',
      incompatibilites: [
        {
          isIncompatible: (situation) => !hasEspaceShared(situation),
          reason: 'Vous ne disposez pas d’espace extérieur pour disposer l’unité extérieure',
          source: 'Formulaire',
        },
      ],
      inconvenients: ['Double abonnement et double maintenance', 'Nuisances sonores', 'Impact esthétique des modules extérieurs'],
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
      avantages: ['Aucune émission CO₂', 'Technologie mature', "Coût de la chaleur compétitif une fois l'installation amortie"],
      coutInstallation: '2 000 à 3 000 €',
      coutParAnPublicodeKey: 'Solaire thermique',
      description:
        "L’exposition et la surface de votre toiture pourraient être propices à l’installation de capteurs solaires thermiques pour couvrir une partie de votre eau chaude sanitaire. Une solution fiable, mature et économique à l'usage, qui fonctionne avec un appoint pour les périodes de faible ensoleillement.",
      estPossible: (situation) =>
        hasCollectiveHotWaterMode(situation) &&
        hasCollectiveOutdoorEquipmentSpace(situation) &&
        hasSufficientSolarThermalCoverage(situation),
      gainClasse: 1,
      gainVsGaz: -50,
      icone: 'img/icon-solaire.webp',
      incompatibilites: [
        {
          isIncompatible: hasInsufficientSolarThermalCoverage,
          reason: 'La place disponible en toiture est insuffisante ou l’orientation n’est pas idéale.',
          source: 'Cerema',
        },
      ],
      inconvenients: [
        'Investissement initial important',
        "Ne couvre que l'eau chaude sanitaire",
        'Travaux modérés mais potentiellement complexes',
      ],
      label: 'Solaire thermique',
      pertinence: 2,
      prerequis: (situation) => [
        { label: 'Système eau chaude sanitaire collectif', source: 'Formulaire', status: 'favorable' },
        ...getArchitecturalProtectionPrerequisites(situation),
        { label: 'Espace requis en local technique pour les ballons de stockage', status: 'aVerifier' },
        { label: 'Espace requis sur la toiture pour les capteurs', status: 'aVerifier' },
      ],
      usage: 'hotWaterOnly',
    },
    {
      avantages: ['Très faibles émissions de CO₂', 'Aucune nuisance sonore', 'Solution mature et fiable'],
      coutInstallation: '3 000 à 4 000 €',
      coutParAnPublicodeKey: 'PAC capteurs solaires atmosphériques',
      description:
        "Votre toiture pourrait accueillir des capteurs solaires atmosphériques qui alimentent une pompe à chaleur dédiée à l'eau chaude sanitaire. Une solution silencieuse, sans unité extérieure bruyante, avec de très faibles émissions de CO₂ qui nécessite cependant une place importante en local technique pour les ballons de stockage.",
      estPossible: (situation) => hasCollectiveHotWaterMode(situation) && hasCollectiveOutdoorEquipmentSpace(situation),
      gainClasse: 1,
      icone: 'img/icon-solaire.webp',
      inconvenients: ['Travaux modérés mais complexes selon structure du bâtiment', 'Nécessite une toiture adaptée'],
      label: 'PAC sur capteurs solaires atmosphériques',
      pertinence: 2,
      prerequis: (situation) => [
        { label: 'Système eau chaude sanitaire collectif', source: 'Formulaire', status: 'favorable' },
        ...getArchitecturalProtectionPrerequisites(situation),
        { label: 'Espace requis en local technique pour les ballons de stockage', status: 'aVerifier' },
        { label: 'Espace requis sur la toiture pour les capteurs', status: 'aVerifier' },
      ],
      usage: 'hotWaterOnly',
    },
    {
      avantages: ['Faibles émissions de CO₂', 'Solution compacte et éprouvée', 'Permet de conserver le système de chauffage existant'],
      coutInstallation: '2 000 à 3 000 €',
      coutParAnPublicodeKey: 'PAC air-eau collective ECS',
      description:
        "Votre bâtiment semble disposer d’un espace extérieur pour accueillir une pompe à chaleur air/eau collective destinée à l’eau chaude sanitaire. Elle capte les calories de l'air extérieur pour chauffer l’eau.",
      estPossible: (situation) => hasCollectiveHotWaterMode(situation) && hasCollectiveOutdoorEquipmentSpace(situation),
      gainClasse: 1,
      icone: 'img/icon-pac.webp',
      inconvenients: ['Nuisances sonores', 'Étude acoustique nécessaire', "Impact esthétique de l'unité extérieure"],
      label: 'Pompe à chaleur air-eau collective',
      pertinence: 2,
      prerequis: (situation) => [
        { label: 'Système ECS collectif', source: 'Formulaire', status: 'favorable' },
        ...getArchitecturalProtectionPrerequisites(situation),
        { label: 'Espace requis pour les modules extérieurs', status: 'aVerifier' },
        { label: 'Espace requis en local technique pour les ballons de stockage', status: 'aVerifier' },
        {
          label: 'Réglementation acoustique : le bruit ne doit pas dépasser les seuils du Code de la santé publique',
          status: 'aVerifier',
        },
        {
          label: "Raccordement électrique du bâtiment adapté à la puissance de l'équipement",
          status: 'aVerifier',
        },
      ],
      usage: 'hotWaterOnly',
    },
    {
      avantages: [
        'Faibles émissions de CO₂',
        "Économique à l'usage par rapport à un ballon électrique classique",
        'Solution simple à installer',
      ],
      coutInstallation: '2 000 à 3 000 €',
      coutParAnPublicodeKey: 'Chauffe-eau thermodynamique',
      description:
        "Votre logement pourrait accueillir un chauffe-eau thermodynamique avec unité extérieure. Il produit votre eau chaude sanitaire à partir de l'air extérieur, avec un gain important sur votre facture par rapport à un ballon électrique classique.",
      estPossible: (situation) => hasIndividualHotWaterMode(situation) && hasIndividualOutdoorEquipmentSpace(situation),
      gainClasse: 1,
      icone: 'img/icon-pac.webp',
      inconvenients: [
        'Nuisance sonore à prendre en compte',
        "Impact esthétique de l'unité extérieure",
        "Travaux de changement de système dans l'appartement",
      ],
      label: 'Chauffe-eau thermodynamique',
      pertinence: 2,
      prerequis: (situation) => [
        ...getArchitecturalProtectionPrerequisites(situation),
        { label: 'Espace requis pour le module extérieur', status: 'aVerifier' },
        {
          label: 'Réglementation acoustique : le bruit ne doit pas dépasser les seuils du Code de la santé publique',
          status: 'aVerifier',
        },
      ],
      usage: 'hotWaterOnly',
    },
  ],
  immeuble_chauffage_individuel: [
    {
      avantages: [
        'Faibles émissions de CO₂',
        'Suppression de la chaudière individuelle (gain de place, sécurité)',
        'Rafraîchissement possible si émetteurs compatibles',
      ],
      coutInstallation: '7 000 à 10 000 €',
      coutParAnPublicodeKey: 'PAC air-eau indiv',
      description:
        'Votre appartement pourrait accueillir une pompe à chaleur air/eau individuelle. Elle remplacerait votre chaudière gaz et produirait chauffage et eau chaude, avec un gain important sur vos émissions de CO₂.',
      estPossible: (situation) =>
        hasIndividualOutdoorEquipmentSpace(situation) && hasIndividualHotWaterMode(situation) && hasWaterHeatingEmitter(situation),
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
      inconvenients: ['Nuisance sonore', 'Impact esthétique des modules extérieurs', "Travaux de changement de système dans l'appartement"],
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
      avantages: ['Faibles émissions de CO₂', 'Possibilité de couvrir les besoins en froid', 'Installation relativement simple'],
      coutInstallation: '3 000 à 5 000 €',
      coutParAnPublicodeKey: 'PAC air-air indiv',
      description:
        "Votre appartement pourrait accueillir une pompe à chaleur air/air, qui remplacerait vos radiateurs électriques et pourrait aussi rafraîchir en été. Prévoir un système complémentaire pour l'eau chaude sanitaire.",
      estPossible: (situation) =>
        hasIndividualOutdoorEquipmentSpace(situation) && hasAnyHotWaterMode(situation) && hasElectricOrOtherHeatingEmitter(situation),
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
      inconvenients: [
        'Faible confort thermique (air soufflé)',
        'Nuisances sonores',
        'Impact esthétique des modules extérieurs',
        "N'assure pas la production d'eau chaude sanitaire",
      ],
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
    {
      avantages: ['Aucune émission CO₂', 'Technologie mature', "Coût de la chaleur compétitif une fois l'installation amortie"],
      coutInstallation: '2 000 à 3 000 €',
      coutParAnPublicodeKey: 'Solaire thermique',
      description:
        "L’exposition et la surface de votre toiture pourraient être propices à l’installation de capteurs solaires thermiques pour couvrir une partie de votre eau chaude sanitaire. Une solution fiable, mature et économique à l'usage, qui fonctionne avec un appoint pour les périodes de faible ensoleillement.",
      estPossible: (situation) =>
        hasCollectiveHotWaterMode(situation) &&
        hasIndividualOutdoorEquipmentSpace(situation) &&
        hasSufficientSolarThermalCoverage(situation),
      gainClasse: 1,
      gainVsGaz: -50,
      icone: 'img/icon-solaire.webp',
      incompatibilites: [
        {
          isIncompatible: hasInsufficientSolarThermalCoverage,
          reason: 'La place disponible en toiture est insuffisante ou l’orientation n’est pas idéale.',
          source: 'Cerema',
        },
      ],
      inconvenients: [
        'Investissement initial important',
        "Ne couvre que l'eau chaude sanitaire",
        'Travaux modérés mais potentiellement complexes',
      ],
      label: 'Solaire thermique',
      pertinence: 2,
      prerequis: (situation) => [
        { label: 'Système eau chaude sanitaire collectif', source: 'Formulaire', status: 'favorable' },
        ...getArchitecturalProtectionPrerequisites(situation),
        { label: 'Espace requis en local technique pour les ballons de stockage', status: 'aVerifier' },
        { label: 'Espace requis sur la toiture pour les capteurs', status: 'aVerifier' },
      ],
      usage: 'hotWaterOnly',
    },
    {
      avantages: ['Très faibles émissions de CO₂', 'Aucune nuisance sonore', 'Solution mature et fiable'],
      coutInstallation: '3 000 à 4 000 €',
      coutParAnPublicodeKey: 'PAC capteurs solaires atmosphériques',
      description:
        "Votre toiture pourrait accueillir des capteurs solaires atmosphériques qui alimentent une pompe à chaleur dédiée à l'eau chaude sanitaire. Une solution silencieuse, sans unité extérieure bruyante, avec de très faibles émissions de CO₂ qui nécessite cependant une place importante en local technique pour les ballons de stockage.",
      estPossible: (situation) => hasCollectiveHotWaterMode(situation) && hasCollectiveOutdoorEquipmentSpace(situation),
      gainClasse: 1,
      icone: 'img/icon-solaire.webp',
      inconvenients: ['Travaux modérés mais complexes selon structure du bâtiment', 'Nécessite une toiture adaptée'],
      label: 'PAC sur capteurs solaires atmosphériques',
      pertinence: 2,
      prerequis: (situation) => [
        { label: 'Système eau chaude sanitaire collectif', source: 'Formulaire', status: 'favorable' },
        ...getArchitecturalProtectionPrerequisites(situation),
        { label: 'Espace requis en local technique pour les ballons de stockage', status: 'aVerifier' },
        { label: 'Espace requis sur la toiture pour les capteurs', status: 'aVerifier' },
      ],
      usage: 'hotWaterOnly',
    },
    {
      avantages: [
        'Faibles émissions de CO₂',
        "Économique à l'usage par rapport à un ballon électrique classique",
        'Solution simple à installer',
      ],
      coutInstallation: '2 000 à 3 000 €',
      coutParAnPublicodeKey: 'Chauffe-eau thermodynamique',
      description:
        "Votre logement pourrait accueillir un chauffe-eau thermodynamique avec unité extérieure. Il produit votre eau chaude sanitaire à partir de l'air extérieur, avec un gain important sur votre facture par rapport à un ballon électrique classique.",
      estPossible: (situation) => hasIndividualHotWaterMode(situation) && hasIndividualOutdoorEquipmentSpace(situation),
      gainClasse: 1,
      icone: 'img/icon-pac.webp',
      inconvenients: [
        'Nuisance sonore à prendre en compte',
        "Impact esthétique de l'unité extérieure",
        "Travaux de changement de système dans l'appartement",
      ],
      label: 'Chauffe-eau thermodynamique',
      pertinence: 2,
      prerequis: (situation) => [
        ...getArchitecturalProtectionPrerequisites(situation),
        { label: 'Espace requis pour le module extérieur', status: 'aVerifier' },
        {
          label: 'Réglementation acoustique : le bruit ne doit pas dépasser les seuils du Code de la santé publique',
          status: 'aVerifier',
        },
      ],
      usage: 'hotWaterOnly',
    },
    {
      avantages: ['Faibles émissions de CO₂', 'Solution compacte et éprouvée', 'Permet de conserver le système de chauffage existant'],
      coutInstallation: '2 000 à 3 000 €',
      coutParAnPublicodeKey: 'PAC air-eau collective ECS',
      description:
        "Votre bâtiment semble disposer d’un espace extérieur pour accueillir une pompe à chaleur air/eau collective destinée à l’eau chaude sanitaire. Elle capte les calories de l'air extérieur pour chauffer l’eau.",
      estPossible: (situation) => hasCollectiveHotWaterMode(situation) && hasCollectiveOutdoorEquipmentSpace(situation),
      gainClasse: 1,
      icone: 'img/icon-pac.webp',
      inconvenients: ['Nuisances sonores', 'Étude acoustique nécessaire', "Impact esthétique de l'unité extérieure"],
      label: 'Pompe à chaleur air-eau collective',
      pertinence: 2,
      prerequis: (situation) => [
        { label: 'Système ECS collectif', source: 'Formulaire', status: 'favorable' },
        ...getArchitecturalProtectionPrerequisites(situation),
        { label: 'Espace requis pour les modules extérieurs', status: 'aVerifier' },
        { label: 'Espace requis en local technique pour les ballons de stockage', status: 'aVerifier' },
        {
          label: 'Réglementation acoustique : le bruit ne doit pas dépasser les seuils du Code de la santé publique',
          status: 'aVerifier',
        },
        {
          label: "Raccordement électrique du bâtiment adapté à la puissance de l'équipement",
          status: 'aVerifier',
        },
      ],
      usage: 'hotWaterOnly',
    },
  ],
  maison_individuelle: [
    {
      avantages: [
        'Faibles émissions de CO₂',
        'Coût de la chaleur compétitif',
        'Rafraîchissement possible si émetteurs compatibles',
        'Aucune unité extérieure visible',
      ],
      coutInstallation: '20 000 à 25 000 €',
      coutParAnPublicodeKey: 'PAC eau-eau indiv',
      description:
        'Votre maison est située en zone favorable à la géothermie. La pompe à chaleur géothermique puise la chaleur naturelle du sol pour chauffer votre maison et votre eau chaude, avec un très bon rendement et sans unité extérieure visible.',
      estPossible: (situation) =>
        hasEspaceForHouseEquipment(situation) &&
        hasCollectiveHotWaterMode(situation) &&
        hasCompatibleGeothermalPotential(situation) &&
        hasWaterHeatingEmitter(situation),
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
      avantages: [
        'Faibles émissions de CO₂',
        'Longévité des équipements',
        'Coût de la chaleur compétitif',
        'Énergie renouvelable et locale',
      ],
      coutInstallation: '10 000 à 17 000 €',
      coutParAnPublicodeKey: 'PAC eau-eau indiv',
      description:
        'Une chaudière biomasse pourrait équiper votre maison. Sous réserve d’espaces suffisamment importants et d’un approvisionnement local en bois disponible, cette solution vous permettrait de réduire les émissions CO₂ de votre maison.',
      estPossible: (situation) =>
        hasEspaceForHouseEquipment(situation) && hasAnyHotWaterMode(situation) && hasWaterHeatingEmitter(situation),
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
      inconvenients: ['Investissement initial important', 'Approvisionnement à prévoir'],
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
        'Faibles émissions de CO₂',
        'Économique si bien dimensionnée',
        'Possibilité de couvrir les besoins en froid si associée à des ventilo-convecteurs',
      ],
      coutInstallation: '12 000 à 15 000 €',
      coutParAnPublicodeKey: 'PAC air-eau indiv',
      description:
        "Votre maison semble adaptée à l'installation d'une pompe à chaleur air/eau individuelle. Elle remplace votre chaudière et produit chauffage et eau chaude à partir de l'air extérieur, pour diminuer vos émissions de CO₂ et réduire fortement votre facture.\nUne solution à privilégier pour les maisons récentes ou rénovées pour une meilleure efficacité !",
      estPossible: (situation) =>
        hasAnyOutdoorSpace(situation) && hasIndividualHotWaterMode(situation) && hasWaterHeatingEmitter(situation),
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
      inconvenients: ['Nuisances sonores (unité extérieure)', 'Impact esthétique des modules extérieurs'],
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
      avantages: [
        'Faibles émissions de CO₂',
        'Coût de la chaleur compétitif',
        'Longévité des équipements',
        'Énergie renouvelable et locale',
      ],
      coutInstallation: '4 000 à 6 000 €',
      coutParAnPublicodeKey: 'Poêle à granulés indiv',
      description:
        "Votre maison pourrait accueillir un poêle à bûches ou à granulés, en appoint ou en chauffage principal d'une pièce de vie. Cette solution renouvelable, au bois local, avec un coût de la chaleur compétitif est à compléter par un système de chauffage central et/ou d’eau chaude.",
      estPossible: (situation) => hasAnyOutdoorSpace(situation) && hasIndividualHotWaterMode(situation),
      gainClasse: 1,
      icone: 'img/icon-biomasse.webp',
      incompatibilites: [
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
      avantages: [
        'Faibles émissions de CO₂',
        'Possibilité de couvrir les besoins en froid',
        'Économique si bien dimensionnée',
        'Installation relativement simple',
      ],
      coutInstallation: '6 000 à 8 000 €',
      coutParAnPublicodeKey: 'PAC air-air indiv',
      description:
        "Votre maison pourrait accueillir une pompe à chaleur air/air, qui capte les calories de l'air extérieur pour chauffer (ou rafraîchir) votre intérieur. Une solution simple à installer, à prévoir avec un système complémentaire pour l'eau chaude sanitaire.",
      estPossible: (situation) => hasAnyOutdoorSpace(situation) && hasIndividualHotWaterMode(situation),
      gainClasse: 1,
      icone: 'img/icon-pac.webp',
      incompatibilites: [
        {
          isIncompatible: (situation) => situation.espaceExterieur === 'none',
          reason: 'Vous ne disposez pas d’espace extérieur pour installer l’unité extérieure de la PAC',
          source: 'Formulaire',
        },
      ],
      inconvenients: [
        'Faible confort thermique (air soufflé)',
        'Nuisances sonores',
        'Impact esthétique des modules extérieurs',
        "N'assure pas la production d'eau chaude sanitaire",
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
      avantages: [
        'Faibles émissions de CO₂',
        'Coût de la chaleur compétitif',
        'Longévité des équipements',
        'Couvre à la fois chauffage et ECS',
      ],
      coutInstallation: '20 000 à 25 000 €',
      coutParAnPublicodeKey: 'Système solaire combiné',
      description:
        "L’exposition et la surface de votre toiture pourraient être propices à l’installation d’un système solaire combiné. Les panneaux produisent à la fois le chauffage et l'eau chaude sanitaire. Ce système est toujours associé à un appoint pour les jours de faible ensoleillement.",
      estPossible: (situation) => hasAnyOutdoorSpace(situation) && hasAnyHotWaterMode(situation) && hasWaterHeatingEmitter(situation),
      gainClasse: 2,
      gainVsGaz: -50,
      icone: 'img/icon-solaire.webp',
      inconvenients: ['Investissement initial important', "Nécessite un système d'appoint (gaz, bois ou électricité)"],
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
    {
      avantages: [
        'Faibles émissions de CO₂',
        "Économique à l'usage par rapport à un ballon électrique classique",
        'Solution simple à installer',
      ],
      coutInstallation: '2 000 à 3 000 €',
      coutParAnPublicodeKey: 'Chauffe-eau thermodynamique',
      description:
        "Votre logement pourrait accueillir un chauffe-eau thermodynamique avec unité extérieure. Il produit votre eau chaude sanitaire à partir de l'air extérieur, avec un gain important sur votre facture par rapport à un ballon électrique classique.",
      estPossible: (situation) => hasIndividualHotWaterMode(situation) && hasIndividualOutdoorEquipmentSpace(situation),
      gainClasse: 1,
      icone: 'img/icon-pac.webp',
      inconvenients: [
        'Nuisance sonore à prendre en compte',
        "Impact esthétique de l'unité extérieure",
        "Travaux de changement de système dans l'appartement",
      ],
      label: 'Chauffe-eau thermodynamique',
      pertinence: 2,
      prerequis: (situation) => [
        ...getArchitecturalProtectionPrerequisites(situation),
        { label: 'Espace requis pour le module extérieur', status: 'aVerifier' },
        {
          label: 'Réglementation acoustique : le bruit ne doit pas dépasser les seuils du Code de la santé publique',
          status: 'aVerifier',
        },
      ],
      usage: 'hotWaterOnly',
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
