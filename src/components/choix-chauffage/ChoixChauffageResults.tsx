import Badge from '@codegouvfr/react-dsfr/Badge';
import type { ReactNode } from 'react';

import type { TypeLogement } from '@/components/choix-chauffage/type-logement';
import Accordion from '@/components/ui/Accordion';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Heading from '@/components/ui/Heading';
import Icon from '@/components/ui/Icon';
import Link from '@/components/ui/Link';
import Tooltip from '@/components/ui/Tooltip';
import useEligibilityForm from '@/hooks/useEligibilityForm';
import type { AddressDetail } from '@/types/HeatNetworksResponse';
import { isDefined } from '@/utils/core';
import cx from '@/utils/cx';

type ModeDeChauffage = {
  label: string;
  pertinence: number | ((addressDetail: AddressDetail) => ReactNode);
  description: string;
  custom?: (addressDetail: AddressDetail) => ReactNode;
  contraintesTechniques: ReactNode[];
  avantages: string[];
  inconvenients: string[];
  gainsPotentielsCO2: NonNullable<ReactNode>[];
  gainsPotentielsCout: NonNullable<ReactNode>[];
  aidesInstallation: NonNullable<ReactNode>[];
};

const contrainteTechniqueZoneARisque = (
  <>
    Dans les zones à risque significatif, dites « zones rouges », le projet nécessite une autorisation au titre du code minier (
    <Link isExternal href="https://www.geothermies.fr/espace-cartographique">
      voir les zones
    </Link>
    )
  </>
);

const modeDeChauffageParTypeLogement: Record<TypeLogement, ModeDeChauffage[]> = {
  immeuble_chauffage_collectif: [
    {
      aidesInstallation: [
        <>
          Le coup de pouce chauffage des bâtiments résidentiels collectifs et tertiaires permet de réduire significativement les coûts de
          raccordement.{' '}
          <Link href="/ressources/aides" isExternal>
            En savoir plus
          </Link>
        </>,
        <>
          Le raccordement est également éligible à MaPrimeRénov’Copropriété s’il s’intègre dans un projet de rénovation globale.{' '}
          <Link href="https://www.anah.gouv.fr/sites/default/files/2025-03/202503-guide-aides-financieres.pdf" isExternal>
            En savoir plus
          </Link>
        </>,
      ],
      avantages: [
        'Faibles émissions de CO2',
        'Prix maîtrisés (stabilité permise par l’usage d’énergies locales)',
        'Suppression des chaudières (gain de place, sécurité)',
        "Garantie d'un service public",
      ],
      contraintesTechniques: [
        'Réseau de chaleur à proximité',
        'Pour certains réseaux, seuil de puissance requis',
        'Local pour la sous-station',
      ],
      custom: (addressDetail) => {
        const { open: displayContactForm, EligibilityFormModal } = useEligibilityForm({
          address: {
            address: addressDetail.geoAddress?.properties.label,
            addressDetails: addressDetail,
            coordinates: addressDetail.geoAddress?.geometry.coordinates,
          },
          context: 'choix-chauffage',
          id: `eligibility-form-choix-chauffage`,
          initialHeatingType: 'collectif',
        });

        const isInFuturNetworkZone = addressDetail.network.futurNetwork && addressDetail.network.distance === null;
        return (
          <>
            {addressDetail.network.isEligible ? (
              <div className="font-bold">
                {addressDetail.network.futurNetwork
                  ? 'Un réseau de chaleur passera bientôt à proximité de votre adresse.'
                  : 'Un réseau de chaleur passe à proximité immédiate de cette adresse.'}
              </div>
            ) : (
              <div className="font-bold">Aucun réseau de chaleur ne passe actuellement à proximité de votre adresse.</div>
            )}

            <div className="flex items-center gap-2 fr-my-1w">
              <Icon name="ri-map-pin-line" size="sm" />
              {addressDetail.geoAddress?.properties.label}

              {!isInFuturNetworkZone &&
                (addressDetail.network.isEligible ? (
                  <div className="text-success fr-ml-1w">
                    <Icon name="ri-guide-line" size="sm" className="fr-mr-1v" />
                    réseau à {addressDetail.network.distance}m à vol d’oiseau
                  </div>
                ) : (
                  <div className="text-error fr-ml-1w">
                    <Icon name="ri-close-line" size="sm" className="fr-mr-1v" />
                    {isDefined(addressDetail.network.distance)
                      ? `réseau à ${addressDetail.network.distance}m à vol d’oiseau`
                      : 'Aucun réseau de chaleur à proximité immédiate'}
                  </div>
                ))}
            </div>

            {addressDetail.network.inPDP && (
              <div className="my-4">
                <span className="font-bold">Vous êtes dans le périmètre de développement prioritaire</span> du réseau. Une obligation de
                raccordement peut exister (
                <Link href="/ressources/obligations-raccordement#contenu" isExternal>
                  en savoir plus
                </Link>
                ). Une amende de 300 000€ peut s’appliquer en cas de non-raccordement sans dérogation.
              </div>
            )}
            <div />

            <EligibilityFormModal />
            <Button onClick={displayContactForm} className="fr-mb-2w">
              Faire une demande d’information
            </Button>
          </>
        );
      },
      description:
        'Le chauffage urbain consiste à distribuer de la chaleur produite de façon centralisée à un ensemble de bâtiments, via des canalisations souterraines. On parle aussi de réseaux de chaleur. Ces réseaux sont alimentés en moyenne à plus de 66% par des énergies renouvelables et de récupération locales.',
      gainsPotentielsCO2: [
        <>
          -74% par rapport au gaz{' '}
          <Tooltip title="chaudière gaz collective sans condensation" iconProps={{ className: 'fr-ml-1v', size: 'xs' }} />
        </>,
        '-81% par rapport au fioul',
      ],
      gainsPotentielsCout: [
        <>
          -39% par rapport au gaz{' '}
          <Tooltip title="chaudière gaz collective sans condensation" iconProps={{ className: 'fr-ml-1v', size: 'xs' }} />
        </>,
        '-43% par rapport au fioul',
      ],
      inconvenients: ['Contrats de longue durée (15-20 ans)'],
      label: 'Chauffage urbain (réseaux de chaleur)',
      pertinence: (addressDetail) =>
        addressDetail.network.isEligible ? <PertinenceBadge pertinence={4} /> : <PertinenceBadge pertinence="unavailable" />,
    },
    {
      aidesInstallation: [
        <>
          Le coup de pouce chauffage des bâtiments résidentiels collectifs et tertiaires est mobilisable lorsque le raccordement à un réseau
          de chaleur est impossible.
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
        'Faibles émissions de CO2',
        'Energie locale stable dans le temps',
        'Suppression des chaudières (gain de place, sécurité)',
        'Possibilité de couvrir les besoins en climatisation',
      ],
      contraintesTechniques: [
        'Présence d’un potentiel géothermique exploitable sous le bâtiment',
        'Isolation globale nécessaire au préalable pour éviter des performances dégradées (chauffage peu efficace et onéreux)',
        'Radiateurs basse température ou plancher chauffant',
        'Surface extérieure pour le forage, ainsi qu’un local technique',
        contrainteTechniqueZoneARisque,
      ],
      description:
        'La pompe à chaleur géothermique (eau-eau) capte les calories du sous-sol et les transfère à un circuit d’eau chaude pour assurer le chauffage et l’eau chaude sanitaire de votre logement.',
      gainsPotentielsCO2: [
        <>
          -88% par rapport au gaz{' '}
          <Tooltip title="chaudière gaz collective sans condensation" iconProps={{ className: 'fr-ml-1v', size: 'xs' }} />
        </>,
        '-91% par rapport au fioul',
      ],
      gainsPotentielsCout: [
        <>
          +5% par rapport au gaz{' '}
          <Tooltip title="chaudière gaz collective sans condensation" iconProps={{ className: 'fr-ml-1v', size: 'xs' }} />
        </>,
        '-2% par rapport au fioul',
      ],
      inconvenients: ['Investissement initial important', 'Travaux d’installation conséquents', 'Maintenance à assurer'],
      label: 'Pompe à chaleur géothermique (eau-eau)',
      pertinence: 3,
    },
    {
      aidesInstallation: [
        <>
          Le coup de pouce chauffage des bâtiments résidentiels collectifs et tertiaires est mobilisable lorsque le raccordement à un réseau
          de chaleur est impossible.
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
        'Faibles émissions de CO2',
        'Économique si bien dimensionnée',
        'Suppression des chaudières (gain de place, sécurité)',
        'Possibilité de couvrir les besoins en climatisation',
      ],
      contraintesTechniques: [
        'Isolation globale nécessaire au préalable pour éviter des performances dégradées (chauffage peu efficace et onéreux)',
        'Radiateurs basse température ou plancher chauffant',
        'Espace extérieur demeurant accessible pour la maintenance',
        'Local technique',
        'Peu conseillé en climat rigoureux (performances réduites)',
      ],
      description:
        'La pompe à chaleur air/eau capte les calories de l’air extérieur et les transfère à un circuit d’eau chaude pour assurer le chauffage et l’eau chaude sanitaire de votre logement.',
      gainsPotentielsCO2: [
        <>
          -90% par rapport au gaz{' '}
          <Tooltip title="chaudière gaz collective sans condensation" iconProps={{ className: 'fr-ml-1v', size: 'xs' }} />
        </>,
        '-92% par rapport au fioul',
      ],
      gainsPotentielsCout: [
        <>
          -20% par rapport au gaz{' '}
          <Tooltip title="chaudière gaz collective sans condensation" iconProps={{ className: 'fr-ml-1v', size: 'xs' }} />
        </>,
        '-24% par rapport au fioul',
      ],
      inconvenients: ['Nuisances sonores', 'Impact esthétique des modules extérieurs'],
      label: 'Pompe à chaleur air-eau',
      pertinence: 2,
    },
    {
      aidesInstallation: [
        <>
          Le coup de pouce chauffage des bâtiments résidentiels collectifs et tertiaires est mobilisable lorsque le raccordement à un réseau
          de chaleur est impossible.
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
      avantages: ['Faibles émissions de CO2', 'Longévité des équipements'],
      contraintesTechniques: [
        'Espace conséquent (chaudière et stockage)',
        'Approvisionnement local disponible',
        'Déconseillé en zone sensible pour la qualité de l’air',
      ],
      description:
        'La chaudière biomasse fonctionne comme une chaudière gaz ou fioul, mais utilise comme combustible du bois, sous différentes formes (granulés, bois déchiqueté, sciures…), ou d’autres combustibles organiques.',
      gainsPotentielsCO2: [
        <>
          -89% par rapport au gaz{' '}
          <Tooltip title="chaudière gaz collective sans condensation" iconProps={{ className: 'fr-ml-1v', size: 'xs' }} />
        </>,
        '-92% par rapport au fioul',
      ],
      gainsPotentielsCout: [
        <>
          +24% par rapport au gaz{' '}
          <Tooltip title="chaudière gaz collective sans condensation" iconProps={{ className: 'fr-ml-1v', size: 'xs' }} />
        </>,
        '+16% par rapport au fioul',
      ],
      inconvenients: ['Investissement initial important', 'Approvisionnement à prévoir', 'Maintenance à assurer'],
      label: 'Chaudière biomasse',
      pertinence: 1,
    },
    {
      aidesInstallation: [],
      avantages: ['Faibles émissions de CO2', 'Possibilité de couvrir les besoins en climatisation'],
      contraintesTechniques: [
        'Emplacement pour l’unité extérieure (autorisation requise)',
        'Isolation globale nécessaire au préalable pour éviter des performances dégradées (chauffage peu efficace et onéreux)',
        'N’assure pas la production d’eau chaude sanitaire',
        'Peu conseillé en climat rigoureux (performances réduites)',
      ],
      description:
        "La pompe à chaleur air/air capte les calories de l'air extérieur et les restitue à l’intérieur en diffusant de l’air chaud.",
      gainsPotentielsCO2: [
        <>
          -76% par rapport au gaz{' '}
          <Tooltip title="chaudière gaz collective sans condensation" iconProps={{ className: 'fr-ml-1v', size: 'xs' }} />
        </>,
        '-82% par rapport au fioul',
      ],
      gainsPotentielsCout: [
        <>
          -1% par rapport au gaz{' '}
          <Tooltip title="chaudière gaz collective sans condensation" iconProps={{ className: 'fr-ml-1v', size: 'xs' }} />
        </>,
        '-7% par rapport au fioul',
      ],
      inconvenients: [
        'Coût (non éligible aux dispositifs d’aides)',
        'Faible confort thermique (air soufflé)',
        'Nuisances sonores',
        'Impact esthétique des modules extérieurs',
      ],
      label: 'Pompe à chaleur air-air individuelle',
      pertinence: -1,
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
      avantages: ['Faibles émissions de CO2', 'Économique si bien dimensionnée', 'Possibilité de couvrir les besoins en climatisation'],
      contraintesTechniques: [
        'Circuit d’eau chaude nécessaire dans l’appartement (remplacement d’un chauffage individuel gaz)',
        'Isolation globale nécessaire au préalable pour éviter des performances dégradées (chauffage peu efficace et onéreux)',
        'Radiateurs basse température ou plancher chauffant',
        'Espace extérieur adapté (autorisation requise) et installation d’un module intérieur',
        'Peu conseillé en climat rigoureux (performances réduites)',
      ],
      description:
        "La pompe à chaleur air/eau capte les calories de l'air extérieur et les transfère à un circuit d’eau chaude pour assurer le chauffage et l’eau chaude sanitaire de votre logement.",
      gainsPotentielsCO2: [
        <>
          -70% par rapport au gaz{' '}
          <Tooltip title="chaudière gaz individuelle sans condensation" iconProps={{ className: 'fr-ml-1v', size: 'xs' }} />
        </>,
      ],
      gainsPotentielsCout: [
        <>
          -13% par rapport au gaz{' '}
          <Tooltip title="chaudière gaz individuelle sans condensation" iconProps={{ className: 'fr-ml-1v', size: 'xs' }} />
        </>,
      ],
      inconvenients: ['Nuisances sonores', 'Impact esthétique des modules extérieurs'],
      label: 'Pompe à chaleur air-eau individuelle',
      pertinence: 3,
    },
    {
      aidesInstallation: [],
      avantages: ['Faibles émissions de CO2', 'Possibilité de couvrir les besoins en climatisation', 'Économique si bien dimensionnée'],
      contraintesTechniques: [
        'Espace extérieur adapté (autorisation requise) et installation d’un module intérieur',
        'Isolation globale nécessaire au préalable pour éviter des performances dégradées (chauffage peu efficace et onéreux)',
        'N’assure pas la production d’eau chaude sanitaire',
        'Peu conseillé en climat rigoureux (performances réduites)',
      ],
      description:
        "La pompe à chaleur air/air capte les calories de l'air extérieur et les restitue à l’intérieur en diffusant de l’air chaud.",
      gainsPotentielsCO2: [
        <>
          -75% par rapport au gaz{' '}
          <Tooltip title="chaudière gaz individuelle sans condensation" iconProps={{ className: 'fr-ml-1v', size: 'xs' }} />
        </>,
      ],
      gainsPotentielsCout: [
        <>
          -16% par rapport au gaz{' '}
          <Tooltip title="chaudière gaz individuelle sans condensation" iconProps={{ className: 'fr-ml-1v', size: 'xs' }} />
        </>,
      ],
      inconvenients: [
        'Installation non éligible aux dispositifs d’aides',
        'Faible confort thermique (air soufflé)',
        'Nuisances sonores',
        'Impact esthétique des modules extérieurs',
      ],
      label: 'Pompe à chaleur air-air individuelle',
      pertinence: 1,
    },
    {
      aidesInstallation: [],
      avantages: ['Faibles émissions de CO2', 'Installation simple', 'Entretien facile'],
      contraintesTechniques: ['Bonne isolation nécessaire', 'Peu adapté aux grandes pièces'],
      description:
        'Pouvant utiliser différentes technologies (convecteurs, rayonnants, à inertie…), les radiateurs électriques fonctionnent tous, comme leur nom l’indique, à base d’électricité.',
      gainsPotentielsCO2: [
        <>
          -80% par rapport au gaz{' '}
          <Tooltip title="chaudière gaz individuelle sans condensation" iconProps={{ className: 'fr-ml-1v', size: 'xs' }} />
        </>,
      ],
      gainsPotentielsCout: [
        <>
          -15% par rapport au gaz{' '}
          <Tooltip title="chaudière gaz individuelle sans condensation" iconProps={{ className: 'fr-ml-1v', size: 'xs' }} />
        </>,
      ],
      inconvenients: ['Coût de l’électricité élevé et fluctuant', 'Confort thermique limité (chaleur sèche et peu homogène)'],
      label: 'Radiateurs électriques',
      pertinence: 1,
    },
  ],
  maison_individuelle: [
    {
      aidesInstallation: [
        <>
          MaPrimeRénov’ : jusqu’à 11 000 € d’aides, en fonction des ressources du ménage.{' '}
          <Link href="https://www.anah.gouv.fr/sites/default/files/2025-03/202503-guide-aides-financieres.pdf" isExternal>
            En savoir plus
          </Link>
        </>,
      ],
      avantages: [
        'Faibles émissions de CO2',
        'Energie locale stable dans le temps',
        'Suppression des chaudières (gain de place, sécurité)',
        'Possibilité de couvrir les besoins en climatisation',
      ],
      contraintesTechniques: [
        'Circuit d’eau chaude nécessaire dans la maison',
        'Présence d’un potentiel géothermique exploitable sous la maison',
        'Isolation globale nécessaire au préalable pour éviter des performances dégradées (chauffage peu efficace et onéreux)',
        'Radiateurs basse température ou plancher chauffant',
        'Surface extérieure pour le forage, ainsi qu’un local technique',
        contrainteTechniqueZoneARisque,
      ],
      description:
        'La pompe à chaleur géothermique (eau-eau) capte les calories du sous-sol et les transfère à un circuit d’eau chaude pour assurer le chauffage et l’eau chaude sanitaire de votre logement.',
      gainsPotentielsCO2: [
        <>
          -87% par rapport au gaz{' '}
          <Tooltip title="chaudière gaz individuelle sans condensation" iconProps={{ className: 'fr-ml-1v', size: 'xs' }} />
        </>,
        '-90% par rapport au fioul',
      ],
      gainsPotentielsCout: [
        <>
          -37% par rapport au gaz{' '}
          <Tooltip title="chaudière gaz individuelle sans condensation" iconProps={{ className: 'fr-ml-1v', size: 'xs' }} />
        </>,
        '-35% par rapport au fioul',
      ],
      inconvenients: ['Investissement initial important', 'Travaux d’installation conséquents', 'Maintenance à assurer'],
      label: 'Pompe à chaleur géothermique (eau-eau)',
      pertinence: 4,
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
      avantages: [
        'Faibles émissions de CO2',
        'Économique si bien dimensionnée',
        'Suppression des chaudières (gain de place, sécurité)',
        'Possibilité de couvrir les besoins en climatisation',
      ],
      contraintesTechniques: [
        'Circuit d’eau chaude dans la maison',
        'Isolation globale nécessaire au préalable pour éviter des performances dégradées (chauffage peu efficace et onéreux)',
        'Radiateurs basse température ou plancher chauffant',
        'Espaces extérieur et intérieur demeurant accessibles pour la maintenance',
        'Peu conseillé en climat rigoureux (performances réduites)',
      ],
      description:
        "La pompe à chaleur air/eau capte les calories de l'air extérieur et les transfère à un circuit d’eau chaude pour assurer le chauffage et l’eau chaude sanitaire de votre logement.",
      gainsPotentielsCO2: [
        <>
          -70% par rapport au gaz{' '}
          <Tooltip title="chaudière gaz individuelle sans condensation" iconProps={{ className: 'fr-ml-1v', size: 'xs' }} />
        </>,
        '-77% par rapport au fioul',
      ],
      gainsPotentielsCout: [
        <>
          -13% par rapport au gaz{' '}
          <Tooltip title="chaudière gaz individuelle sans condensation" iconProps={{ className: 'fr-ml-1v', size: 'xs' }} />
        </>,
        '-9% par rapport au fioul',
      ],
      inconvenients: ['Nuisances sonores', 'Impact esthétique des modules extérieurs'],
      label: 'Pompe à chaleur air-eau',
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
      avantages: ['Faibles émissions de CO2', 'Coût de la chaleur compétitif', 'Longévité des équipements'],
      contraintesTechniques: [
        'Circuit d’eau chaude dans la maison',
        'Espace conséquent (chaudière et stockage)',
        'Approvisionnement local disponible',
        'Déconseillé en zone sensible pour la qualité de l’air',
      ],
      description:
        'La chaudière biomasse fonctionne comme une chaudière gaz ou fioul, mais utilise comme combustible du bois, sous différentes formes (granulés, bois déchiqueté, sciures…), ou d’autres combustibles organiques.',
      gainsPotentielsCO2: [
        <>
          -88% par rapport au gaz{' '}
          <Tooltip title="chaudière gaz individuelle sans condensation" iconProps={{ className: 'fr-ml-1v', size: 'xs' }} />
        </>,
        '-91% par rapport au fioul',
      ],
      gainsPotentielsCout: [
        <>
          -11% par rapport au gaz{' '}
          <Tooltip title="chaudière gaz individuelle sans condensation" iconProps={{ className: 'fr-ml-1v', size: 'xs' }} />
        </>,
        '-7% par rapport au fioul',
      ],
      inconvenients: ['Investissement initial important', 'Approvisionnement à prévoir', 'Maintenance à assurer'],
      label: 'Chaudière biomasse',
      pertinence: 1,
    },
    {
      aidesInstallation: [],
      avantages: ['Faibles émissions de CO2', 'Possibilité de couvrir les besoins en climatisation'],
      contraintesTechniques: [
        'Emplacement pour l’unité extérieure ( (autorisation requise)',
        'Isolation globale nécessaire au préalable pour éviter des performances dégradées (chauffage peu efficace et onéreux)',
        'N’assure pas la production d’eau chaude sanitaire',
        'Peu conseillé en climat rigoureux (performances réduites)',
      ],
      description:
        "La pompe à chaleur air/air capte les calories de l'air extérieur et les restitue à l’intérieur en diffusant de l’air chaud.",
      gainsPotentielsCO2: [
        <>
          -75% par rapport au gaz{' '}
          <Tooltip title="chaudière gaz individuelle sans condensation" iconProps={{ className: 'fr-ml-1v', size: 'xs' }} />
        </>,
        '-81% par rapport au fioul',
      ],
      gainsPotentielsCout: [
        <>
          -16% par rapport au gaz{' '}
          <Tooltip title="chaudière gaz individuelle sans condensation" iconProps={{ className: 'fr-ml-1v', size: 'xs' }} />
        </>,
        '-15% par rapport au fioul',
      ],
      inconvenients: [
        'Coût (non éligible aux dispositifs d’aides)',
        'Faible confort thermique (air soufflé)',
        'Nuisances sonores',
        'Impact esthétique des modules extérieurs',
      ],
      label: 'Pompe à chaleur air-air',
      pertinence: -1,
    },
    {
      aidesInstallation: [],
      avantages: ['Faibles émissions de CO2', 'Installation simple', 'Entretien facile'],
      contraintesTechniques: ['Bonne isolation nécessaire', 'Peu adapté aux grandes pièces'],
      description:
        'Pouvant utiliser différentes technologies (convecteurs, rayonnants, à inertie…), les radiateurs électriques fonctionnent tous, comme leur nom l’indique, à base d’électricité.',
      gainsPotentielsCO2: [
        <>
          -80% par rapport au gaz{' '}
          <Tooltip title="chaudière gaz individuelle sans condensation" iconProps={{ className: 'fr-ml-1v', size: 'xs' }} />
        </>,
        '-85% par rapport au fioul',
      ],
      gainsPotentielsCout: [
        <>
          -15% par rapport au gaz{' '}
          <Tooltip title="chaudière gaz individuelle sans condensation" iconProps={{ className: 'fr-ml-1v', size: 'xs' }} />
        </>,
        '-12% par rapport au fioul',
      ],
      inconvenients: ['Coût de l’électricité élevé et fluctuant', 'Confort thermique limité (chaleur sèche et peu homogène)'],
      label: 'Radiateurs électriques',
      pertinence: -1,
    },
  ],
};

type ChoixChauffageResultsProps = {
  typeLogement: TypeLogement;
  addressDetail: AddressDetail;
};

function ChoixChauffageResults({ typeLogement, addressDetail }: ChoixChauffageResultsProps) {
  const modesDeChauffage = modeDeChauffageParTypeLogement[typeLogement];
  return (
    <div>
      {modesDeChauffage.map((modeDeChauffage, key) => (
        <Accordion
          label={
            <>
              {modeDeChauffage.label}
              {typeof modeDeChauffage.pertinence === 'number' ? (
                <PertinenceBadge pertinence={modeDeChauffage.pertinence} />
              ) : (
                modeDeChauffage.pertinence(addressDetail)
              )}
            </>
          }
          className="[&>.fr-collapse]:bg-gray-100 [&>.fr-collapse]:mx-0! [&_.fr-accordion\\_\\_btn]:py-5"
          key={key}
        >
          <Heading as="h3">{modeDeChauffage.label}</Heading>
          <p>{modeDeChauffage.description}</p>

          {modeDeChauffage.custom && addressDetail && modeDeChauffage.custom(addressDetail)}

          <div className="flex flex-col gap-4">
            <ResultSection color="orange" title="⚠️ Contraintes techniques">
              <ul>
                {modeDeChauffage.contraintesTechniques.map((contrainteTechnique, key) => (
                  <li key={key}>{contrainteTechnique}</li>
                ))}
              </ul>
            </ResultSection>

            <div className="grid grid-cols-2 gap-4">
              <ResultSection title="👍 Avantages">
                <ul>
                  {modeDeChauffage.avantages.map((avantage, key) => (
                    <li key={key}>{avantage}</li>
                  ))}
                </ul>
              </ResultSection>
              <ResultSection title="👎 Inconvénients">
                <ul>
                  {modeDeChauffage.inconvenients.map((inconvenient, key) => (
                    <li key={key}>{inconvenient}</li>
                  ))}
                </ul>
              </ResultSection>
            </div>

            <ResultSection title="⭐ Gains potentiels par rapport au gaz et fioul">
              <ul>
                <li className="leading-7">
                  Émissions de CO2&nbsp;:{' '}
                  {modeDeChauffage.gainsPotentielsCO2.map((gain, key) => (
                    <PageBadge className="bg-success!" key={key}>
                      {gain}
                    </PageBadge>
                  ))}
                </li>
                <li className="leading-7">
                  Coût global annuel&nbsp;:{' '}
                  {modeDeChauffage.gainsPotentielsCout.map((gain, key) => (
                    <PageBadge className="bg-fcu-purple!" key={key}>
                      {gain}
                    </PageBadge>
                  ))}
                </li>
              </ul>
              <Alert variant="warning" size="sm" className="fr-mt-2w">
                Les gains varient fortement en fonction de l'adresse et des caractéristiques du bâtiment ! Obtenez une simulation affinée
                avec notre comparateur.
              </Alert>
              <div className="fr-mt-2w text-center">
                <Link
                  variant="primary"
                  href={`/pro/comparateur-couts-performances?address=${encodeURIComponent(addressDetail.geoAddress?.properties.label ?? '')}`}
                  eventKey="Lien|Choix chauffage vers comparateur"
                  isExternal
                >
                  Obtenez une simulation affinée avec notre comparateur
                </Link>
              </div>
            </ResultSection>

            <ResultSection title="⭐ Aide à l’installation">
              <ul>
                {modeDeChauffage.aidesInstallation.length === 0 && 'Aucune'}
                {modeDeChauffage.aidesInstallation.map((aideInstallation, key) => (
                  <li key={key}>{aideInstallation}</li>
                ))}
              </ul>
            </ResultSection>
          </div>
        </Accordion>
      ))}
    </div>
  );
}

export default ChoixChauffageResults;

const ResultSection = ({ children, color = 'blue', title }: { children: ReactNode; color?: 'orange' | 'blue'; title?: string }) => (
  <div className={cx('fr-p-2w', color === 'orange' ? 'bg-[#FFE8E5]' : 'bg-[#E3E3FD]')}>
    <p className="text-lg font-bold fr-mb-2w!">{title}</p>
    {children}
  </div>
);

const PertinenceBadge = ({ pertinence }: { pertinence: number | 'unavailable' }) =>
  pertinence === 'unavailable' ? (
    <PageBadge className="bg-[#ef8347]!">Non disponible à cette adresse</PageBadge>
  ) : pertinence > 0 ? (
    <PageBadge className="bg-success!">Pertinence {Array(pertinence).fill('⭐').join('')}</PageBadge>
  ) : pertinence === -1 ? (
    <PageBadge className="bg-error!">Non conseillé</PageBadge>
  ) : null;

const PageBadge = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement> & { children: NonNullable<ReactNode> }) => (
  <Badge className={cx(' text-white! normal-case! fr-mx-1w', className)} {...props}>
    {children}
  </Badge>
);
