import {
  getArchitecturalProtectionPrerequisites,
  getGeothermalPrerequisites,
  getPdpPrerequisite,
  getPpaPrerequisite,
  HEAT_NETWORK_MAX_DISTANCE,
  hasCompatibleGeothermalPotential,
  hasCompatibleHotWaterMode,
  hasCompatibleRadiator,
  hasEspaceForHouseEquipment,
  hasEspacePrivate,
  hasEspaceShared,
  hasInsufficientSolarThermalCoverage,
  hasSufficientSolarThermalCoverage,
  isNearHeatNetwork,
  outdoorPacPrerequisites,
} from '@/modules/chaleur-renouvelable/client/heating-mode-rules';
import type { IncompatibleSolutionRow, ModeDeChauffage, Situation } from '@/modules/chaleur-renouvelable/constants';
import { type DPE, DPE_VALUES, type TypeLogement } from '@/modules/chaleur-renouvelable/constants';
import { getCoutRaccordementResidentiel, prettyPrintCout } from '@/modules/simulator/client/SimulateurCoutRaccordement';

export type {
  IncompatibleSolutionRow,
  ModeDeChauffage,
  ModeDeChauffageEnriched,
  ModeDeChauffageUsage,
  PrerequisiteRow,
  PrerequisiteStatus,
  Situation,
} from '@/modules/chaleur-renouvelable/constants';

export function improveDpe(dpe: DPE, gainClasse: number): DPE {
  const currentIndex = DPE_VALUES.indexOf(dpe);
  const nextIndex = Math.max(0, currentIndex - Math.max(0, gainClasse));
  return DPE_VALUES[nextIndex];
}

export const modesDeChauffage = {
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
        (situation.eligibiliteReseauChaleur?.isEligible ?? false) &&
        isNearHeatNetwork(situation) &&
        hasCompatibleRadiator(situation, ['radiateur-eau']),
      gainClasse: 1,
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
        hasEspaceShared(situation) &&
        hasCompatibleHotWaterMode(situation, ['Collectif', 'Individuel']) &&
        hasCompatibleRadiator(situation, ['radiateur-eau']) &&
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
          status: 'averifier',
        },
        {
          label: 'Accessibilité de la parcelle pour les machines de forage',
          status: 'averifier',
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
        hasEspaceShared(situation) &&
        hasCompatibleHotWaterMode(situation, ['Collectif', 'Individuel']) &&
        hasCompatibleRadiator(situation, ['radiateur-eau']),
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
          status: 'averifier',
        },
        {
          label: 'Accessibilité de la parcelle pour la livraison du combustible',
          status: 'averifier',
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
        hasEspaceShared(situation) &&
        hasCompatibleHotWaterMode(situation, ['Collectif', 'Individuel']) &&
        hasCompatibleRadiator(situation, ['radiateur-eau']),
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
        { label: 'Espace requis en local technique', status: 'averifier' },
        ...outdoorPacPrerequisites,
        {
          label: "Raccordement électrique du bâtiment adapté à la puissance de l'équipement",
          status: 'averifier',
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
        hasEspaceShared(situation) &&
        hasCompatibleHotWaterMode(situation, ['Collectif', 'Individuel']) &&
        hasCompatibleRadiator(situation, ['radiateur-eau']),
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
        { label: 'Espace requis en local technique', status: 'averifier' },
        ...outdoorPacPrerequisites,
        {
          label: "Raccordement électrique du bâtiment adapté à la puissance de l'équipement",
          status: 'averifier',
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
        hasCompatibleHotWaterMode(situation, ['Collectif']) && hasEspaceShared(situation) && hasSufficientSolarThermalCoverage(situation),
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
        { label: 'Espace requis en local technique pour les ballons de stockage', status: 'averifier' },
        { label: 'Espace requis sur la toiture pour les capteurs', status: 'averifier' },
      ],
      usage: 'hotWaterOnly',
    },
    {
      avantages: ['Très faibles émissions de CO₂', 'Aucune nuisance sonore', 'Solution mature et fiable'],
      coutInstallation: '3 000 à 4 000 €',
      coutParAnPublicodeKey: 'PAC capteurs solaires atmosphériques',
      coutParAnPublicodesSituation: { 'type de production ECS': "'Solaire thermique'" },
      description:
        "Votre toiture pourrait accueillir des capteurs solaires atmosphériques qui alimentent une pompe à chaleur dédiée à l'eau chaude sanitaire. Une solution silencieuse, sans unité extérieure bruyante, avec de très faibles émissions de CO₂ qui nécessite cependant une place importante en local technique pour les ballons de stockage.",
      estPossible: (situation) => hasCompatibleHotWaterMode(situation, ['Collectif']) && hasEspaceShared(situation),
      gainClasse: 1,
      icone: 'img/icon-solaire.webp',
      inconvenients: ['Travaux modérés mais complexes selon structure du bâtiment', 'Nécessite une toiture adaptée'],
      label: 'PAC sur capteurs solaires atmosphériques',
      pertinence: 2,
      prerequis: (situation) => [
        { label: 'Système eau chaude sanitaire collectif', source: 'Formulaire', status: 'favorable' },
        ...getArchitecturalProtectionPrerequisites(situation),
        { label: 'Espace requis en local technique pour les ballons de stockage', status: 'averifier' },
        { label: 'Espace requis sur la toiture pour les capteurs', status: 'averifier' },
      ],
      usage: 'hotWaterOnly',
    },
    {
      avantages: ['Faibles émissions de CO₂', 'Solution compacte et éprouvée', 'Permet de conserver le système de chauffage existant'],
      coutInstallation: '2 000 à 3 000 €',
      coutParAnPublicodeKey: 'PAC air-eau collective ECS',
      coutParAnPublicodesSituation: { 'type de production ECS': "'Avec équipement chauffage'" },
      description:
        "Votre bâtiment semble disposer d’un espace extérieur pour accueillir une pompe à chaleur air/eau collective destinée à l’eau chaude sanitaire. Elle capte les calories de l'air extérieur pour chauffer l’eau.",
      estPossible: (situation) => hasCompatibleHotWaterMode(situation, ['Collectif']) && hasEspaceShared(situation),
      gainClasse: 1,
      icone: 'img/icon-pac.webp',
      inconvenients: ['Nuisances sonores', 'Étude acoustique nécessaire', "Impact esthétique de l'unité extérieure"],
      label: 'Pompe à chaleur air-eau collective',
      pertinence: 2,
      prerequis: (situation) => [
        { label: 'Système ECS collectif', source: 'Formulaire', status: 'favorable' },
        ...getArchitecturalProtectionPrerequisites(situation),
        { label: 'Espace requis pour les modules extérieurs', status: 'averifier' },
        { label: 'Espace requis en local technique pour les ballons de stockage', status: 'averifier' },
        {
          label: 'Réglementation acoustique : le bruit ne doit pas dépasser les seuils du Code de la santé publique',
          status: 'averifier',
        },
        {
          label: "Raccordement électrique du bâtiment adapté à la puissance de l'équipement",
          status: 'averifier',
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
      coutParAnPublicodesSituation: { 'type de production ECS': "'Avec équipement chauffage'" },
      description:
        "Votre logement pourrait accueillir un chauffe-eau thermodynamique avec unité extérieure. Il produit votre eau chaude sanitaire à partir de l'air extérieur, avec un gain important sur votre facture par rapport à un ballon électrique classique.",
      estPossible: (situation) => hasCompatibleHotWaterMode(situation, ['Individuel']) && hasEspacePrivate(situation),
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
        { label: 'Espace requis pour le module extérieur', status: 'averifier' },
        {
          label: 'Réglementation acoustique : le bruit ne doit pas dépasser les seuils du Code de la santé publique',
          status: 'averifier',
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
        hasEspacePrivate(situation) &&
        hasCompatibleHotWaterMode(situation, ['Individuel']) &&
        hasCompatibleRadiator(situation, ['radiateur-eau']),
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
      label: 'Pompe à chaleur air-eau individuelle',
      pertinence: 3,
      prerequis: (situation) => [
        {
          label: 'Chauffage individuel et radiateurs à eau',
          source: 'Formulaire',
          status: 'favorable',
        },
        ...getArchitecturalProtectionPrerequisites(situation),
        { label: 'Règlementation de la copro autorisant la pose d’unités extérieures sur les balcons', status: 'averifier' },
        ...outdoorPacPrerequisites,
        {
          label: "Raccordement électrique de l’appartement adapté à la puissance de l'équipement",
          status: 'averifier',
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
        hasEspacePrivate(situation) &&
        hasCompatibleHotWaterMode(situation, ['Collectif', 'Individuel']) &&
        hasCompatibleRadiator(situation, ['radiateur-electrique', 'none']),
      gainClasse: 2,
      icone: 'img/icon-pac.webp',
      incompatibilites: [
        {
          isIncompatible: (situation) => !hasEspacePrivate(situation),
          reason: 'Vous ne disposez pas d’espace extérieur pour installer l’unité extérieure',
          source: 'Formulaire',
        },
        {
          isIncompatible: (situation) => situation.typeRadiateur === 'radiateur-eau',
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
      label: 'Pompe à chaleur air-air individuelle',
      pertinence: 1,
      prerequis: (situation) => [
        {
          label: 'Chauffage individuel et radiateurs électriques',
          source: 'Formulaire',
          status: 'favorable',
        },
        ...getArchitecturalProtectionPrerequisites(situation),
        { label: 'Règlementation de la copro autorisant la pose d’unités extérieures sur les balcons', status: 'averifier' },
        ...outdoorPacPrerequisites,
        {
          label: "Raccordement électrique de l’appartement adapté à la puissance de l'équipement",
          status: 'averifier',
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
        hasCompatibleHotWaterMode(situation, ['Collectif']) && hasEspacePrivate(situation) && hasSufficientSolarThermalCoverage(situation),
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
        { label: 'Espace requis en local technique pour les ballons de stockage', status: 'averifier' },
        { label: 'Espace requis sur la toiture pour les capteurs', status: 'averifier' },
      ],
      usage: 'hotWaterOnly',
    },
    {
      avantages: ['Très faibles émissions de CO₂', 'Aucune nuisance sonore', 'Solution mature et fiable'],
      coutInstallation: '3 000 à 4 000 €',
      coutParAnPublicodeKey: 'PAC capteurs solaires atmosphériques',
      coutParAnPublicodesSituation: { 'type de production ECS': "'Solaire thermique'" },
      description:
        "Votre toiture pourrait accueillir des capteurs solaires atmosphériques qui alimentent une pompe à chaleur dédiée à l'eau chaude sanitaire. Une solution silencieuse, sans unité extérieure bruyante, avec de très faibles émissions de CO₂ qui nécessite cependant une place importante en local technique pour les ballons de stockage.",
      estPossible: (situation) => hasCompatibleHotWaterMode(situation, ['Collectif']) && hasEspaceShared(situation),
      gainClasse: 1,
      icone: 'img/icon-solaire.webp',
      inconvenients: ['Travaux modérés mais complexes selon structure du bâtiment', 'Nécessite une toiture adaptée'],
      label: 'PAC sur capteurs solaires atmosphériques',
      pertinence: 2,
      prerequis: (situation) => [
        { label: 'Système eau chaude sanitaire collectif', source: 'Formulaire', status: 'favorable' },
        ...getArchitecturalProtectionPrerequisites(situation),
        { label: 'Espace requis en local technique pour les ballons de stockage', status: 'averifier' },
        { label: 'Espace requis sur la toiture pour les capteurs', status: 'averifier' },
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
      coutParAnPublicodesSituation: { 'type de production ECS': "'Avec équipement chauffage'" },
      description:
        "Votre logement pourrait accueillir un chauffe-eau thermodynamique avec unité extérieure. Il produit votre eau chaude sanitaire à partir de l'air extérieur, avec un gain important sur votre facture par rapport à un ballon électrique classique.",
      estPossible: (situation) => hasCompatibleHotWaterMode(situation, ['Individuel']) && hasEspacePrivate(situation),
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
        { label: 'Espace requis pour le module extérieur', status: 'averifier' },
        {
          label: 'Réglementation acoustique : le bruit ne doit pas dépasser les seuils du Code de la santé publique',
          status: 'averifier',
        },
      ],
      usage: 'hotWaterOnly',
    },
    {
      avantages: ['Faibles émissions de CO₂', 'Solution compacte et éprouvée', 'Permet de conserver le système de chauffage existant'],
      coutInstallation: '2 000 à 3 000 €',
      coutParAnPublicodeKey: 'PAC air-eau collective ECS',
      coutParAnPublicodesSituation: { 'type de production ECS': "'Chauffe-eau électrique'" },
      description:
        "Votre bâtiment semble disposer d’un espace extérieur pour accueillir une pompe à chaleur air/eau collective destinée à l’eau chaude sanitaire. Elle capte les calories de l'air extérieur pour chauffer l’eau.",
      estPossible: (situation) => hasCompatibleHotWaterMode(situation, ['Collectif']) && hasEspaceShared(situation),
      gainClasse: 1,
      icone: 'img/icon-pac.webp',
      inconvenients: ['Nuisances sonores', 'Étude acoustique nécessaire', "Impact esthétique de l'unité extérieure"],
      label: 'Pompe à chaleur air-eau collective',
      pertinence: 2,
      prerequis: (situation) => [
        { label: 'Système ECS collectif', source: 'Formulaire', status: 'favorable' },
        ...getArchitecturalProtectionPrerequisites(situation),
        { label: 'Espace requis pour les modules extérieurs', status: 'averifier' },
        { label: 'Espace requis en local technique pour les ballons de stockage', status: 'averifier' },
        {
          label: 'Réglementation acoustique : le bruit ne doit pas dépasser les seuils du Code de la santé publique',
          status: 'averifier',
        },
        {
          label: "Raccordement électrique du bâtiment adapté à la puissance de l'équipement",
          status: 'averifier',
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
        hasCompatibleHotWaterMode(situation, ['Collectif']) &&
        hasCompatibleGeothermalPotential(situation) &&
        hasCompatibleRadiator(situation, ['radiateur-eau']),
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
      label: 'Pompe à chaleur géothermique',
      pertinence: 3,
      prerequis: (situation) => [
        {
          label: 'Maison à chauffage individuel et radiateurs à eau',
          source: 'Formulaire',
          status: 'favorable',
        },
        ...getGeothermalPrerequisites(situation),
        { label: 'Accessibilité de la parcelle pour les machines de forage', status: 'averifier' },
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
        hasEspaceForHouseEquipment(situation) &&
        hasCompatibleHotWaterMode(situation, ['Collectif', 'Individuel']) &&
        hasCompatibleRadiator(situation, ['radiateur-eau']),
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
      label: 'Chaudière biomasse',
      pertinence: 2,
      prerequis: (situation) => [
        {
          label: 'Maison à chauffage individuel et radiateurs à eau',
          source: 'Formulaire',
          status: 'favorable',
        },
        ...getPpaPrerequisite(situation),
        ...getArchitecturalProtectionPrerequisites(situation),
        { label: 'Espace requis en local technique pour la chaudière et le stockage', status: 'averifier' },
        { label: 'Accessibilité de la parcelle pour la livraison du combustible', status: 'averifier' },
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
        situation.espaceExterieur !== 'none' &&
        hasCompatibleHotWaterMode(situation, ['Individuel']) &&
        hasCompatibleRadiator(situation, ['radiateur-eau']),
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
      label: 'Pompe à chaleur air-eau individuelle',
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
          status: 'averifier',
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
      estPossible: (situation) => situation.espaceExterieur !== 'none' && hasCompatibleHotWaterMode(situation, ['Individuel']),
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
        ...getPpaPrerequisite(situation),
        { label: 'Accessibilité de la parcelle pour la livraison du combustible', status: 'averifier' },
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
      estPossible: (situation) => situation.espaceExterieur !== 'none' && hasCompatibleHotWaterMode(situation, ['Individuel']),
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
      label: 'Pompe à chaleur air-air individuelle',
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
          status: 'averifier',
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
      estPossible: (situation) =>
        situation.espaceExterieur !== 'none' &&
        hasCompatibleHotWaterMode(situation, ['Collectif', 'Individuel']) &&
        hasCompatibleRadiator(situation, ['radiateur-eau']),
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
        { label: 'Espace requis en local technique pour les ballons de stockage', status: 'averifier' },
        { label: 'Espace requis sur la toiture pour les capteurs', status: 'averifier' },
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
      coutParAnPublicodesSituation: { 'type de production ECS': "'Avec équipement chauffage'" },
      description:
        "Votre logement pourrait accueillir un chauffe-eau thermodynamique avec unité extérieure. Il produit votre eau chaude sanitaire à partir de l'air extérieur, avec un gain important sur votre facture par rapport à un ballon électrique classique.",
      estPossible: (situation) => hasCompatibleHotWaterMode(situation, ['Individuel']) && hasEspacePrivate(situation),
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
        { label: 'Espace requis pour le module extérieur', status: 'averifier' },
        {
          label: 'Réglementation acoustique : le bruit ne doit pas dépasser les seuils du Code de la santé publique',
          status: 'averifier',
        },
      ],
      usage: 'hotWaterOnly',
    },
  ],
} satisfies Record<TypeLogement, ModeDeChauffage[]>;

export function getModesDeChauffage(typeLogement: TypeLogement, situation: Situation) {
  return modesDeChauffage[typeLogement].filter((heatingMode) => heatingMode.estPossible(situation));
}

export function getIncompatibleSolutionRows(situation: Situation, typeLogement: TypeLogement): IncompatibleSolutionRow[] {
  return modesDeChauffage[typeLogement].flatMap((heatingMode) =>
    (heatingMode.incompatibilites ?? [])
      .filter((incompatibilite) => incompatibilite.isIncompatible(situation))
      .map(({ reason, source }) => ({
        label: heatingMode.label,
        reason,
        source,
      }))
  );
}
