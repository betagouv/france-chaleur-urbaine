import Badge from '@codegouvfr/react-dsfr/Badge';
import { type ReactNode } from 'react';

import { type TypeLogement } from '@/components/choix-chauffage/type-logement';
import Accordion from '@/components/ui/Accordion';
import Alert from '@/components/ui/Alert';
import Heading from '@/components/ui/Heading';
import Link from '@/components/ui/Link';
import cx from '@/utils/cx';

type ModeDeChauffage = {
  label: string;
  pertinence: number;
  description: string;
  contraintesTechniques: string[];
  avantages: string[];
  inconvenients: string[];
  gainsPotentielsCO2: string[];
  gainsPotentielsCout: string[];
  aidesInstallation: ReactNode[];
};

const modeDeChauffageParTypeLogement: Record<TypeLogement, ModeDeChauffage[]> = {
  immeuble_chauffage_collectif: [
    {
      label: 'Chauffage urbain (réseaux de chaleur)',
      pertinence: 4,
      description:
        'Le chauffage urbain consiste à distribuer de la chaleur produite de façon centralisée à un ensemble de bâtiments, via des canalisations souterraines. On parle aussi de réseaux de chaleur. Ces réseaux sont alimentés en moyenne à plus de 66% par des énergies renouvelables et de récupération locales.',
      contraintesTechniques: [
        'Réseau de chaleur à proximité, avec capacités de raccordement.',
        'Pour certains réseaux, seuil de puissance requis',
        'Local pour la sous-station',
      ],
      avantages: [
        'Faibles émissions de CO2',
        'Prix maîtrisés (stabilité permise par l’usage d’énergies locales)',
        'Suppression des chaudières (gain de place, sécurité)',
        "Garantie d'un service public",
      ],
      inconvenients: ['Contrats de longue durée (15-20 ans)'],
      gainsPotentielsCO2: ['-49% par rapport au gaz', '-62% par rapport au fioul'],
      gainsPotentielsCout: ['-23% par rapport au gaz', '-27% par rapport au fioul'],
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
    },
    {
      label: 'Pompe à chaleur géothermique (eau-eau)',
      pertinence: 3,
      description:
        'La pompe à chaleur géothermique (eau-eau) capte les calories du sous-sol et les transfère à un circuit d’eau chaude pour assurer le chauffage et l’eau chaude sanitaire de votre logement.',
      contraintesTechniques: [
        'Présence d’un potentiel géothermique exploitable sous le bâtiment',
        'Isolation globale nécessaire au préalable pour éviter des performances dégradées (chauffage peu efficace et onéreux)',
        'Surface extérieure pour le forage, ainsi qu’un local technique',
      ],
      avantages: [
        'Faibles émissions de CO2',
        'Energie locale stable dans le temps',
        'Suppression des chaudières (gain de place, sécurité)',
        'Possibilité de couvrir les besoins en froid',
      ],
      inconvenients: ['Investissement initial important', 'Travaux d’installation conséquents', 'Maintenance à assurer'],
      gainsPotentielsCO2: ['-90% par rapport au gaz', '-92% par rapport au fioul'],
      gainsPotentielsCout: ['-9% par rapport au gaz', '-14% par rapport au fioul'],
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
    },
    {
      label: 'Pompe à chaleur air-eau',
      pertinence: 2,
      description:
        'La pompe à chaleur air/eau capte les calories de l’air extérieur et les transfère à un circuit d’eau chaude pour assurer le chauffage et l’eau chaude sanitaire de votre logement.',
      contraintesTechniques: [
        'Isolation globale nécessaire au préalable pour éviter des performances dégradées (chauffage peu efficace et onéreux)',
        'Espace extérieur demeurant accessible pour la maintenance',
        'Local technique',
        'Peu conseillé en climat rigoureux (performances réduites)',
      ],
      avantages: [
        'Faibles émissions de CO2',
        'Économique si bien dimensionnée',
        'Suppression des chaudières (gain de place, sécurité)',
        'Possibilité de couvrir les besoins en froid',
      ],
      inconvenients: ['Nuisances sonores', 'Impact esthétique des modules extérieurs'],
      gainsPotentielsCO2: ['-90% par rapport au gaz', '-93% par rapport au fioul'],
      gainsPotentielsCout: ['-25% par rapport au gaz', '-29% par rapport au fioul'],
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
    },
    {
      label: 'Chaudière biomasse',
      pertinence: 1,
      description: '',
      contraintesTechniques: [
        'Espace conséquent (chaudière et stockage)',
        'Approvisionnement local disponible',
        'Déconseillé en zone sensible pour la qualité de l’air',
      ],
      avantages: ['Faibles émissions de CO2', 'Longévité des équipements'],
      inconvenients: ['Investissement initial important', 'Approvisionnement à prévoir', 'Maintenance à assurer'],
      gainsPotentielsCO2: ['-89% par rapport au gaz', '-92% par rapport au fioul'],
      gainsPotentielsCout: ['+18% par rapport au gaz', '+12% par rapport au fioul'],
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
    },
    {
      label: 'PAC air-air individuelle',
      pertinence: 0,
      description: '',
      contraintesTechniques: [
        'Emplacement pour l’unité extérieure ( (autorisation requise)',
        'Isolation globale nécessaire au préalable pour éviter des performances dégradées (chauffage peu efficace et onéreux)',
        'N’assure pas la production d’eau chaude sanitaire',
        'Peu conseillé en climat rigoureux (performances réduites)',
      ],
      avantages: ['Faibles émissions de CO2', 'Possibilité de couvrir les besoins en froid'],
      inconvenients: [
        'Coût (non éligible aux dispositifs d’aides)',
        'Faible confort thermique (air soufflé)',
        'Nuisances sonores',
        'Impact esthétique des modules extérieurs',
      ],
      gainsPotentielsCO2: ['-89% par rapport au gaz', '-92% par rapport au fioul'],
      gainsPotentielsCout: ['+38% par rapport au gaz', '+31% par rapport au fioul'],
      aidesInstallation: [],
    },
  ],
  immeuble_chauffage_individuel: [],
  maison_individuelle: [],
};

type ChoixChauffageResultsProps = {
  typeLogement: TypeLogement;
  address: string;
};

function ChoixChauffageResults({ typeLogement, address: _ }: ChoixChauffageResultsProps) {
  const modesDeChauffage = modeDeChauffageParTypeLogement[typeLogement];
  return (
    <div>
      {modesDeChauffage.map((modeDeChauffage, key) => (
        <Accordion
          label={
            <>
              {modeDeChauffage.label}
              <PertinenceBadge pertinence={modeDeChauffage.pertinence} />
            </>
          }
          key={key}
        >
          <Heading as="h3">{modeDeChauffage.label}</Heading>
          <p>{modeDeChauffage.description}</p>
          <div className="flex flex-col gap-4">
            <ResultSection color="orange" title="⚠️ Contraintes techniques">
              <ul className="text-sm">
                {modeDeChauffage.contraintesTechniques.map((contrainteTechnique, key) => (
                  <li key={key}>{contrainteTechnique}</li>
                ))}
              </ul>
            </ResultSection>

            <div className="grid grid-cols-2 gap-4">
              <ResultSection title="👍 Avantages">
                <ul className="text-sm">
                  {modeDeChauffage.avantages.map((avantage, key) => (
                    <li key={key}>{avantage}</li>
                  ))}
                </ul>
              </ResultSection>
              <ResultSection title="👎 Inconvénients">
                <ul className="text-sm">
                  {modeDeChauffage.inconvenients.map((inconvenient, key) => (
                    <li key={key}>{inconvenient}</li>
                  ))}
                </ul>
              </ResultSection>
            </div>

            <ResultSection title="⭐ Gains potentiels par rapport au gaz et fioul">
              <ul className="text-sm">
                <li>
                  Émissions de CO2&nbsp;:{' '}
                  {modeDeChauffage.gainsPotentielsCO2.map((gain, key) => (
                    <PageBadge className="!bg-green-600" key={key}>
                      {gain}
                    </PageBadge>
                  ))}
                </li>
                <li>
                  Coût global annuel&nbsp;:{' '}
                  {modeDeChauffage.gainsPotentielsCout.map((gain, key) => (
                    <PageBadge className="!bg-[#8585F6]" key={key}>
                      {gain}
                    </PageBadge>
                  ))}
                </li>
              </ul>
              <Alert variant="warning" size="sm" className="fr-mt-2w [&>p]:!text-sm">
                Les gains varient fortement en fonction de l'adresse et des caractéristiques du bâtiment ! Obtenez une simulation affinée
                avec notre comparateur.
              </Alert>
              <Link variant="primary" href="/comparateur-couts-performances" mt="2w" className="!d-inline-block fr-mx-auto">
                Accéder au comparateur
              </Link>
            </ResultSection>

            <ResultSection title="⭐ Aide à l’installation">
              <ul className="text-sm">
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
  <div className={cx('bg-white fr-p-2w shadow-md', color === 'orange' ? 'bg-[#FFE8E5]' : 'bg-[#E3E3FD]')}>
    <p className="text-lg font-bold !fr-mb-2w">{title}</p>
    {children}
  </div>
);

const PertinenceBadge = ({ pertinence }: { pertinence: number }) =>
  pertinence > 0 ? (
    <PageBadge className="!bg-green-600">Pertinence {Array(pertinence).fill('⭐').join('')}</PageBadge>
  ) : (
    <PageBadge className="!bg-red-400">Non conseillé</PageBadge>
  );

const PageBadge = ({ children, className }: { children: NonNullable<ReactNode>; className?: string }) => (
  <Badge className={cx(' !text-white !normal-case fr-mx-1w', className)}>{children}</Badge>
);
