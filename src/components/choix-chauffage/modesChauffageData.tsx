import type { ReactNode } from 'react';

import type { TypeLogement } from '@/components/choix-chauffage/type-logement';
import Link from '@/components/ui/Link';
import Tooltip from '@/components/ui/Tooltip';
import type { EspaceExterieur } from '@/modules/app/types';
import type { AddressDetail } from '@/types/HeatNetworksResponse';

export type ModeDeChauffage = {
  label: string;
  pertinence: number | ((addressDetail: AddressDetail) => ReactNode);
  description: string;
  contraintesTechniques: ReactNode[];
  avantages: string[];
  inconvenients: string[];
  coutParAn: (situation: Situation) => string;
  coutInstallation: string;
  gainClasse: number;
  gainVsGaz: number;
  gainsPotentielsCout: NonNullable<ReactNode>[];
  aidesInstallation: NonNullable<ReactNode>[];
  estPossible: (situation: Situation) => boolean;
};

export type Situation = {
  espacesExterieurs(espacesExterieurs: any): unknown;
  espaceExterieur: EspaceExterieur;
  ppa: boolean;
  gmi: boolean;
  dpe: DPE;
  adresse: string | null;
  nbLogements: number;
  surfaceMoyenne: number;
  habitantsMoyen: number;
};

export type DPE = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';

export const DPE_ORDER = ['A', 'B', 'C', 'D', 'E', 'F', 'G'] as const satisfies readonly DPE[];
export const DPE_BG: Record<DPE, string> = {
  A: 'bg-[#00A06C]',
  B: 'bg-[#52B053]',
  C: 'bg-[#A6CB71]',
  D: 'bg-[#F5E70F]',
  E: 'bg-[#F0B50E]',
  F: 'bg-[#EC8136]',
  G: 'bg-[#D7211F]',
};

export const espaceExterieurValues = ['shared', 'private', 'both', 'none'] as const satisfies readonly EspaceExterieur[];

export const espaceExterieurOptions = [
  { description: 'Cour, jardin, toit terrasse…', label: 'Espaces partagés uniquement', value: 'shared' },
  { description: 'Balcons, terrasses…', label: 'Espaces individuels uniquement', value: 'private' },
  { description: 'Cour, jardin, toit terrasse, balcons…', label: 'Espaces partagés et individuels', value: 'both' },
  { label: 'Aucun espace extérieur', value: 'none' },
] as const;
export function improveDpe(dpe: DPE, gainClasse: number): DPE {
  const currentIndex = DPE_ORDER.indexOf(dpe);
  const nextIndex = Math.max(0, currentIndex - Math.max(0, gainClasse));
  return DPE_ORDER[nextIndex];
}

const hasEspaceShared = (situation: Situation) => ['shared', 'both'].includes(situation.espaceExterieur);

export const modeDeChauffageParTypeLogement: Record<TypeLogement, ModeDeChauffage[]> = {
  immeuble_chauffage_collectif: [
    // {
    //   aidesInstallation: [
    //     <>
    //       Le coup de pouce chauffage des bâtiments résidentiels collectifs et tertiaires permet de réduire significativement les coûts de
    //       raccordement.{' '}
    //       <Link href="/ressources/aides" isExternal>
    //         En savoir plus
    //       </Link>
    //     </>,
    //     <>
    //       Le raccordement est également éligible à MaPrimeRénov’Copropriété s’il s’intègre dans un projet de rénovation globale.{' '}
    //       <Link href="https://www.anah.gouv.fr/sites/default/files/2025-03/202503-guide-aides-financieres.pdf" isExternal>
    //         En savoir plus
    //       </Link>
    //     </>,
    //   ],
    //   avantages: [
    //     'Faibles émissions de CO₂',
    //     'Prix stables',
    //     'TVA réduite à 5,5 %',
    //     "Garantie d'un service public",
    //   ],
    //   contraintesTechniques: [
    //      "Proximité à un réseau : Disponible X m à vol d’oiseau / Zone prioritaire" // (si PDP = True)
    //      'Seuil de puissance requis : à vérifier',
    //      'Local pour la sous-station : à vérifier',
    //   ],
    //   description:
    //     "Le réseau de chaleur (ou chauffage urbain) distribue de la chaleur produite de façon centralisée à un ensemble de bâtiments, via des canalisations souterraines. Ces réseaux sont alimentés en majorité par des énergies renouvelables et de récupération locales. C'est la solution à privilégier pour un chauffage collectif lorsqu'elle est disponible.",
    //   gainClasse: 1,
    //   gainVsGaz: 74,
    //   gainsPotentielsCout: [
    //     <>
    //       -39% par rapport au gaz{' '}
    //       <Tooltip title="chaudière gaz collective sans condensation" iconProps={{ className: 'fr-ml-1v', size: 'xs' }} />
    //     </>,
    //     '-43% par rapport au fioul',
    //   ],
    //   inconvenients: ['Long contrat (15-20 ans)'],
    //   label: 'Chauffage urbain (réseaux de chaleur)',
    //   pertinence: 4
    // },
    {
      aidesInstallation: [
        <>
          Le coup de pouce chauffage des bâtiments résidentiels collectifs et tertiaires est mobilisable lorsque le raccordement à un réseau
          de chaleur est impossible.{' '}
          <Link
            href="https://www.ecologie.gouv.fr/politiques-publiques/coup-pouce-chauffage-batiments-residentiels-collectifs-tertiaires"
            isExternal
          >
            En savoir plus
          </Link>
        </>,
        <>
          L’installation est également éligible à MaPrimeRénov’ si elle nécessite des travaux au sein des appartements, et à
          MaPrimeRénov’Copropriété si elle s’intègre dans un projet de rénovation globale.{' '}
          <Link href="https://www.anah.gouv.fr/sites/default/files/2025-03/202503-guide-aides-financieres.pdf" isExternal>
            En savoir plus
          </Link>
        </>,
      ],
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
      coutParAn(situation: Situation): string {
        throw new Error('Function not implemented.');
      },
      description:
        "La pompe à chaleur géothermique (eau-eau) capte les calories du sous-sol (sol ou nappe phréatique) et les transfère à un circuit d'eau chaude pour assurer le chauffage et l'eau chaude sanitaire. Elle est très efficace et écologique, idéale si l'espace extérieur permet un forage. Cette solution nécessite un bâtiment bien isolé ou équipé de planchers chauffants pour être performante.",
      estPossible: (situation) => hasEspaceShared(situation) && situation.gmi === true,
      gainClasse: 2,
      gainsPotentielsCout: [
        <>
          +5% par rapport au gaz{' '}
          <Tooltip title="chaudière gaz collective sans condensation" iconProps={{ className: 'fr-ml-1v', size: 'xs' }} />
        </>,
        '-2% par rapport au fioul',
      ],
      gainVsGaz: 88,
      inconvenients: ['Investissement initial important', 'Travaux d’installation conséquents'],
      label: 'Pompe à chaleur géothermique',
      pertinence: 3,
    },
    {
      aidesInstallation: [
        <>
          Le coup de pouce chauffage des bâtiments résidentiels collectifs et tertiaires est mobilisable lorsque le raccordement à un réseau
          de chaleur est impossible.{' '}
          <Link
            href="https://www.ecologie.gouv.fr/politiques-publiques/coup-pouce-chauffage-batiments-residentiels-collectifs-tertiaires"
            isExternal
          >
            En savoir plus
          </Link>
        </>,
        <>
          L’installation est également éligible à MaPrimeRénov’ si elle nécessite des travaux au sein des appartements, et à
          MaPrimeRénov’Copropriété si elle s’intègre dans un projet de rénovation globale.{' '}
          <Link href="https://www.anah.gouv.fr/sites/default/files/2025-03/202503-guide-aides-financieres.pdf" isExternal>
            En savoir plus
          </Link>
        </>,
      ],
      avantages: ['Faibles émissions de CO₂', 'Longévité des équipements'],
      contraintesTechniques: [
        'Espace conséquent (chaudière et stockage)',
        'Approvisionnement local disponible',
        'Déconseillé en zone sensible pour la qualité de l’air (commune avec PPA)',
      ],
      coutInstallation: '6 000 à 8 000 €',
      coutParAn(situation: Situation): string {
        throw new Error('Function not implemented.');
      },
      description:
        "La chaudière biomasse fonctionne comme une chaudière gaz ou fioul, mais utilise du bois comme combustible (granulés, plaquettes, bûches). C'est une énergie renouvelable et locale. Cette solution nécessite un espace conséquent pour la chaudière et le stockage du combustible, ainsi qu'un approvisionnement régulier.",
      estPossible: (situation) => hasEspaceShared(situation) && situation.ppa !== false,
      gainClasse: 2,
      gainsPotentielsCout: [
        <>
          +24% par rapport au gaz{' '}
          <Tooltip title="chaudière gaz collective sans condensation" iconProps={{ className: 'fr-ml-1v', size: 'xs' }} />
        </>,
        '+16% par rapport au fioul',
      ],
      gainVsGaz: 89,
      inconvenients: ['Investissement initial important', 'Approvisionnement à prévoir', 'Maintenance à assurer'],
      label: 'Chaudière biomasse',
      pertinence: 3,
    },
    {
      aidesInstallation: [
        <>
          Le coup de pouce chauffage des bâtiments résidentiels collectifs et tertiaires est mobilisable lorsque le raccordement à un réseau
          de chaleur est impossible.{' '}
          <Link
            href="https://www.ecologie.gouv.fr/politiques-publiques/coup-pouce-chauffage-batiments-residentiels-collectifs-tertiaires"
            isExternal
          >
            En savoir plus
          </Link>
        </>,
        <>
          L’installation est également éligible à MaPrimeRénov’ si elle nécessite des travaux au sein des appartements, et à
          MaPrimeRénov’Copropriété si elle s’intègre dans un projet de rénovation globale.{' '}
          <Link href="https://www.anah.gouv.fr/sites/default/files/2025-03/202503-guide-aides-financieres.pdf" isExternal>
            En savoir plus
          </Link>
        </>,
      ],
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
      coutParAn(situation: Situation): string {
        throw new Error('Function not implemented.');
      },
      description:
        "La pompe à chaleur air/eau capte les calories de l'air extérieur et les transfère à un circuit d’eau chaude pour assurer le chauffage et l’eau chaude sanitaire de votre logement.",
      estPossible: (situation) => hasEspaceShared(situation),
      gainClasse: 2,
      gainsPotentielsCout: [
        <>
          -20% par rapport au gaz{' '}
          <Tooltip title="chaudière gaz collective sans condensation" iconProps={{ className: 'fr-ml-1v', size: 'xs' }} />
        </>,
        '-24% par rapport au fioul',
      ],
      gainVsGaz: 90,
      inconvenients: ['Nuisances sonores', 'Impact esthétique des modules extérieurs'],
      label: 'Pompe à chaleur air-eau collective',
      pertinence: 2,
    },
    {
      aidesInstallation: [],
      avantages: ['Facilité d’implémentation', 'space extérieur accessible pour la maintenance', 'Local technique'],
      contraintesTechniques: [
        'Emplacement pour l’unité extérieure (autorisation requise)',
        'Isolation globale nécessaire au préalable pour éviter des performances dégradées (chauffage peu efficace et onéreux)',
        'N’assure pas la production d’eau chaude sanitaire',
        'Peu conseillé en climat rigoureux (performances réduites)',
      ],
      coutInstallation: '3 000 à 5 000 €',
      coutParAn(situation: Situation): string {
        throw new Error('Function not implemented.');
      },
      description:
        "La pompe à chaleur air/eau combinée à une chaudière gaz est une solution facile à mettre en place : elle permet d’installer une pompe à chaleur moins puissante tout en réduisant les émissions de CO₂.  La pompe à chaleur capte les calories de l'air extérieur et les transfère à un circuit d’eau chaude pour assurer le chauffage et l’eau chaude sanitaire de votre logement.",
      estPossible: (situation) => hasEspaceShared(situation),
      gainClasse: 1,
      gainsPotentielsCout: [
        <>
          -1% par rapport au gaz{' '}
          <Tooltip title="chaudière gaz collective sans condensation" iconProps={{ className: 'fr-ml-1v', size: 'xs' }} />
        </>,
        '-7% par rapport au fioul',
      ],
      gainVsGaz: 76,
      inconvenients: ['Nuisances sonores', 'Impact esthétique des modules extérieurs'],
      label: 'Hybride : Pompe à chaleur air/eau collective et chaudière gaz',
      pertinence: 1,
    },
    {
      aidesInstallation: [],
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
      coutParAn(situation: Situation): string {
        throw new Error('Function not implemented.');
      },
      description:
        "Les capteurs solaires captent le rayonnement solaire et réchauffent un fluide caloporteur, qui transmet ensuite la chaleur à un ballon d’eau chaude via un échangeur. Le solaire thermique est une solution fiable et mature pour produire une part importante de l'eau chaude sanitaire. Idéal pour les toitures terrasses. Le solaire thermique est une solution à combiner avec un système de chauffage complémentaire qui prend le relai en période de faible ensoleillement.",
      estPossible: (situation) => hasEspaceShared(situation),
      gainClasse: 1,
      gainsPotentielsCout: [
        <>
          -1% par rapport au gaz{' '}
          <Tooltip title="chaudière gaz collective sans condensation" iconProps={{ className: 'fr-ml-1v', size: 'xs' }} />
        </>,
        '-7% par rapport au fioul',
      ],
      gainVsGaz: 50,
      inconvenients: [
        'Investissement initial important',
        "Ne couvre que l'eau chaude sanitaire — nécessite un système d'appoint pour le chauffage",
      ],
      label: 'Solaire thermique',
      pertinence: 3,
    },
  ],
  immeuble_chauffage_individuel: [
    {
      aidesInstallation: [
        <>
          MaPrimeRénov’ : jusqu’à 5000 €, en fonction des ressources du ménage.{' '}
          <Link href="https://www.anah.gouv.fr/sites/default/files/2025-03/202503-guide-aides-financieres.pdf" isExternal>
            En savoir plus
          </Link>
        </>,
      ],
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
      coutParAn: (situation) => '',
      description:
        "La pompe à chaleur air/eau capte les calories de l'air extérieur et les transfère à un circuit d’eau chaude pour assurer le chauffage et l’eau chaude sanitaire de votre logement.",
      estPossible: (situation) => situation.espacesExterieurs === 'private' || situation.espacesExterieurs === 'both',
      gainClasse: 1,
      gainsPotentielsCout: [
        <>
          -13% par rapport au gaz{' '}
          <Tooltip title="chaudière gaz individuelle sans condensation" iconProps={{ className: 'fr-ml-1v', size: 'xs' }} />
        </>,
      ],
      gainVsGaz: 70,
      inconvenients: ['Nuisances sonores', 'Impact esthétique des modules extérieurs'],
      label: 'Pompe à chaleur air-eau individuelle (appartement)',
      pertinence: 3,
    },
    {
      aidesInstallation: [],
      avantages: ['Faibles émissions de CO₂', 'Possibilité de couvrir les besoins en froid'],
      contraintesTechniques: [
        'Emplacement pour l’unité extérieure',
        'Isolation globale recommandée au préalable pour éviter des performances dégradées',
        'N’assure pas la production d’eau chaude sanitaire',
      ],
      coutInstallation: '3 000 à 5 000 €',
      coutParAn(situation: Situation): string {
        throw new Error('Function not implemented.');
      },
      description:
        "La pompe à chaleur air/air capte les calories de l'air extérieur et les restitue à l’intérieur en diffusant de l’air chaud.",
      estPossible: (situation) => situation.espacesExterieurs === 'private' || situation.espacesExterieurs === 'both',
      gainClasse: 2,
      gainsPotentielsCout: [
        <>
          -16% par rapport au gaz{' '}
          <Tooltip title="chaudière gaz individuelle sans condensation" iconProps={{ className: 'fr-ml-1v', size: 'xs' }} />
        </>,
      ],
      gainVsGaz: 75,
      inconvenients: ['Faible confort thermique (air soufflé)', 'Nuisances sonores', 'Impact esthétique des modules extérieurs'],
      label: 'Pompe à chaleur air-air individuelle (appartement)',
      pertinence: 1,
    },
  ],
  maison_individuelle: [
    {
      aidesInstallation: [
        <>
          MaPrimeRénov’ : jusqu’à 5 000 € d’aides, en fonction des ressources du ménage.{' '}
          <Link href="https://www.anah.gouv.fr/sites/default/files/2025-03/202503-guide-aides-financieres.pdf" isExternal>
            En savoir plus
          </Link>
        </>,
      ],
      avantages: [
        'Isolation globale recommandée au préalable pour éviter des performances dégradées (chauffage peu efficace et onéreux)',
        'Espace extérieur accessible pour la maintenance',
        'Local technique',
      ],
      contraintesTechniques: ['Nuisances sonores', 'Impact esthétique des modules extérieurs'],
      coutInstallation: '12 000 à 15 000 €',
      coutParAn(situation: Situation): string {
        throw new Error('Function not implemented.');
      },
      description:
        "La pompe à chaleur air/eau capte les calories de l'air extérieur et les transfère à un circuit d’eau chaude pour assurer le chauffage et l’eau chaude sanitaire de votre logement.",
      estPossible: (situation) => situation.espacesExterieurs !== 'none',
      gainClasse: 2,
      gainsPotentielsCout: [
        <>
          -13% par rapport au gaz{' '}
          <Tooltip title="chaudière gaz individuelle sans condensation" iconProps={{ className: 'fr-ml-1v', size: 'xs' }} />
        </>,
        '-9% par rapport au fioul',
      ],
      gainVsGaz: 70,
      inconvenients: [
        'Faibles émissions de CO₂',
        'Économique si bien dimensionnée',
        'Suppression des chaudières (gain de place, sécurité)',
        'Possibilité de couvrir les besoins en froid si associée à des ventilo-convecteurs',
      ],
      label: 'Pompe à chaleur air-eau individuelle (Maison)',
      pertinence: 2,
    },
    {
      aidesInstallation: [
        <>
          MaPrimeRénov’ : jusqu’à 5 000 € d’aides, en fonction des ressources du ménage.{' '}
          <Link href="https://www.anah.gouv.fr/sites/default/files/2025-03/202503-guide-aides-financieres.pdf" isExternal>
            En savoir plus
          </Link>
        </>,
      ],
      avantages: ['Faibles émissions de CO₂', 'Coût de la chaleur compétitif', 'Longévité des équipements'],
      contraintesTechniques: ['Conduit de fumée requis', 'Espace de stockage pour le combustible', 'Déconseillé en zone PPA'],
      coutInstallation: '4 000 à 6 000 €',
      coutParAn(situation: Situation): string {
        throw new Error('Function not implemented.');
      },
      description:
        "Le poêle est un appareil indépendant qui utilise du bois comme combustible, généralement sous forme de bûches ou de granulés (pellets). Il chauffe principalement la pièce où il est installé. C'est une solution économique à l'usage et écologique, particulièrement adaptée aux maisons individuelles disposant d'un conduit de fumée.",
      estPossible: (situation) => situation.ppa !== false,
      gainClasse: 1,
      gainsPotentielsCout: [
        <>
          -11% par rapport au gaz{' '}
          <Tooltip title="chaudière gaz individuelle sans condensation" iconProps={{ className: 'fr-ml-1v', size: 'xs' }} />
        </>,
        '-7% par rapport au fioul',
      ],
      gainVsGaz: 88,
      inconvenients: ["Ne chauffe qu'une seule pièce", 'Approvisionnement à prévoir'],
      label: 'Poêle à buche ou à granulés ',
      pertinence: 3,
    },
    {
      aidesInstallation: [],
      avantages: ['Faibles émissions de CO₂', 'Possibilité de rafraîchissement en été', "Coût d'installation modéré"],
      contraintesTechniques: [
        "Espace extérieur pour l'unité extérieure",
        'Isolation globale recommandée au préalable',
        'Autorisation de la copropriété généralement requise',
      ],
      coutInstallation: '6 000 à 8 000 €',
      coutParAn(situation: Situation): string {
        throw new Error('Function not implemented.');
      },
      description:
        "La pompe à chaleur air/air capte les calories de l'air extérieur et les restitue à l'intérieur en diffusant de l'air chaud. Elle peut remplacer des radiateurs électriques. Cette solution permet également de rafraîchir le logement en été. Elle ne produit pas d'eau chaude sanitaire : un autre système est nécessaire pour l'ECS.",
      estPossible: (situation) => situation.espacesExterieurs !== 'none',
      gainClasse: 1,
      gainsPotentielsCout: [
        <>
          -16% par rapport au gaz{' '}
          <Tooltip title="chaudière gaz individuelle sans condensation" iconProps={{ className: 'fr-ml-1v', size: 'xs' }} />
        </>,
        '-15% par rapport au fioul',
      ],
      gainVsGaz: 75,
      inconvenients: [
        'Confort thermique limité (air soufflé)',
        "Nuisances sonores de l'unité extérieure",
        "Ne produit pas l'eau chaude sanitaire",
      ],
      label: 'Pompe à chaleur air-air individuelle (maison)',
      pertinence: 1,
    },
    {
      aidesInstallation: [],
      avantages: ['Faibles émissions de CO₂', 'Coût de la chaleur compétitif', 'Longévité des équipements'],
      contraintesTechniques: ['Toiture sans masque et bien orientée', 'Local technique requis', "Système d'appoint obligatoire"],
      coutInstallation: '20 000 à 25 000 €',
      coutParAn(situation: Situation): string {
        throw new Error('Function not implemented.');
      },
      description:
        "Le système solaire combiné (SSC) produit à la fois le chauffage et l'eau chaude sanitaire à partir de panneaux solaires thermiques, généralement installés sur le toit. Ce système doit être associé à un appoint (gaz, bois ou électricité) qui prend le relais en période de faible ensoleillement.",
      estPossible: () => true,
      gainClasse: 2,
      gainsPotentielsCout: [<>-50% par rapport au gaz</>],
      gainVsGaz: 80,
      inconvenients: ['Investissement initial important', "Production dépendante de l'ensoleillement"],
      label: 'Système solaire combiné ',
      pertinence: 3,
    },
  ],
};
