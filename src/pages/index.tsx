import LastArticles from '@components/Articles/LastArticles';
import InterviewsVideos from '@components/Coproprietaire/InterviewsVideos';
import AvantagesChauffageUrbain from '@components/GenericContent/AvantagesChauffageUrbain';
import CoutsChauffageUrbain from '@components/GenericContent/CoutsChauffageUrbain';
import HowToRaccordement from '@components/GenericContent/HowToRaccordement';
import ObligationRaccordement from '@components/GenericContent/ObligationRaccordement';
import ReduireImpact from '@components/GenericContent/ReduireImpact';
import HeadSliceForm from '@components/HeadSliceForm';
import Partners from '@components/Partners/Partners';
import { issues, understandings } from '@components/Ressources/config';
import Understanding from '@components/Ressources/Understanding';
import SimplePage from '@components/shared/page/SimplePage';
import Box, { ResponsiveRow } from '@components/ui/Box';
import Heading from '@components/ui/Heading';
import Link from '@components/ui/Link';
import Text from '@components/ui/Text';
import { Icon } from '@dataesr/react-dsfr';
import Head from 'next/head';
import Image from 'next/image';

const coproprietaireCards = {
  reseau: issues.reseau,
  atouts: issues.atouts,
  'energies-vertes': issues['energies-vertes'],
  faisabilite: understandings.faisabilite,
};

export default function Home() {
  return (
    <SimplePage title="France Chaleur Urbaine : Une solution numérique qui facilite le raccordement à un chauffage économique et écologique">
      <Head>
        <meta
          name="description"
          content="Un réseau de chaleur est un système de distribution de chaleur produite de façon centralisée qui permet de desservir un grand nombre d’usagers (bâtiments tertiaires publics ou privés, copropriétés, logements sociaux,...). Un des atouts majeurs des réseaux de chaleur est de permettre de mobiliser les énergies renouvelables présentes sur le territoire, difficilement distribuables autrement."
        />
      </Head>

      <HeadSliceForm
        checkEligibility
        withWrapper={(form) => (
          <Box backgroundColor="blue-cumulus-950-100">
            <Box
              className="fr-container"
              display="flex"
              alignItems="center"
              gap="16px"
            >
              <Box flex className="fr-hidden fr-unhidden-lg">
                <Image
                  src="/img/copro_header.webp"
                  alt=""
                  width={624}
                  height={420}
                  priority
                />
              </Box>

              <Box flex py="3w">
                <Text fontSize="24px" fontWeight="bold" legacyColor="black">
                  Vous êtes copropriétaire ?
                </Text>
                <Heading as="h1" size="h2" color="blue-france" mt="1w">
                  Le chauffage urbain&nbsp;: une solution écologique à prix
                  maîtrisé&nbsp;!
                </Heading>
                <Text mb="2w">Testez votre éligibilité en 2 clics</Text>
                {form}
              </Box>
            </Box>
          </Box>
        )}
      />

      <Box py="10w" id="comprendre-le-chauffage-urbain">
        <Box className="fr-container">
          <Heading as="h2" center>
            Comprendre le chauffage urbain
          </Heading>
          <ResponsiveRow mt="10w">
            <Box display="flex" flexDirection="column" alignItems="center" flex>
              <Heading as="h3" color="blue-france" mb="4w">
                Un chauffage écologique à prix compétitif déjà adopté par 6
                millions de Français
              </Heading>
              <Text size="lg">
                Le chauffage urbain consiste à{' '}
                <strong>
                  distribuer de la chaleur produite de façon centralisée à un
                  ensemble de bâtiments
                </strong>
                , via des canalisations souterraines. On parle aussi de réseaux
                de chaleur.{' '}
                <strong>
                  Ces réseaux sont alimentés à plus de 66% par des{' '}
                  <Link href="/ressources/energies-vertes#contenu">
                    énergies renouvelables et de récupération locales
                  </Link>
                  .
                </strong>
              </Text>
              <Text size="lg" mt="3w">
                La chaleur est transportée jusqu'à une sous-station installée
                dans votre copropriété, puis acheminée aux différents logements
                par des canalisations internes à l’immeuble.
              </Text>
              <Text size="lg" mt="3w">
                Dans la plupart des cas, le réseau de chaleur appartient à une
                collectivité territoriale et est{' '}
                <Link href="/ressources/acteurs#contenu">
                  géré en concession
                </Link>{' '}
                par un exploitant, qui s’occupe notamment des raccordements.
              </Text>
            </Box>

            <Box flex>
              <Image
                src="/img/copro_comprendre.webp"
                alt="Schéma du chauffage urbain"
                width={944}
                height={890}
                priority
                className="fr-responsive-img"
              />

              <Link variant="primary" href="reseaux-chaleur#contenu">
                En savoir plus
              </Link>
            </Box>
          </ResponsiveRow>
        </Box>
      </Box>

      <Box
        py="10w"
        backgroundColor="blue-france-975-75"
        id="avantages-du-chauffage-urbain"
      >
        <AvantagesChauffageUrbain />
      </Box>

      <Box
        py="10w"
        backgroundColor="blue-france-main-525"
        id="comment-se-raccorder"
      >
        <HowToRaccordement />
      </Box>

      <Box py="10w" id="couts-du-chauffage-urbain">
        <CoutsChauffageUrbain />
      </Box>

      <Box py="10w" backgroundColor="blue-france-975-75">
        <Box className="fr-container">
          <ResponsiveRow>
            <Box flex>
              <Heading as="h4" color="blue-france">
                Un exemple de cas concret
              </Heading>

              <Text size="lg">
                Copropriété chauffée au gaz collectif de 126 logements répartis
                en 3 bâtiments.
              </Text>

              <Box display="flex" alignItems="center" mt="4w">
                <Image
                  src="/img/copro_cout_1.webp"
                  alt=""
                  width={160}
                  height={140}
                  className="img-object-contain"
                />
                <Box ml="2w">
                  <Text size="lg">Durée des travaux&nbsp;:</Text>
                  <Text size="lg" color="success">
                    4 mois
                  </Text>
                </Box>
              </Box>

              <Box display="flex" alignItems="center" mt="1w">
                <Image
                  src="/img/copro_cout_2.webp"
                  alt=""
                  width={160}
                  height={140}
                  className="img-object-contain"
                />
                <Box ml="2w">
                  <Text size="lg">Coût du raccordement&nbsp;:</Text>
                  <Text size="lg">105 000€ - 76 000€ d’aides</Text>
                  <Text size="lg" color="success">
                    = 230€ par lot
                  </Text>
                </Box>
              </Box>

              <Box display="flex" alignItems="center" mt="1w">
                <Image
                  src="/img/copro_cout_3.webp"
                  alt=""
                  width={160}
                  height={140}
                  className="img-object-contain"
                />
                <Box ml="2w">
                  <Text size="lg">Coût de la chaleur&nbsp;:</Text>
                  <Text size="lg">
                    <Text as="span" size="lg" color="success">
                      108€/mois
                    </Text>{' '}
                    pour un T4
                  </Text>
                  <Text size="lg">chauffage et eau chaude</Text>
                </Box>
              </Box>
            </Box>

            <Box flex>
              <Heading as="h4" color="blue-france">
                Les témoignages
              </Heading>
              <Text size="lg" mb="2w">
                Le chauffage urbain, ce sont les copropriétaires et les syndics
                qui en parlent le mieux !
              </Text>

              <Icon name="fr-icon-quote-line" color="#6A6AF4" />

              <Text as="blockquote" ml="0" mt="1w" fontStyle="italic">
                Je conseille vivement le raccordement à un réseau de chaleur
                pour des raisons économiques et écologiques.
              </Text>
              <Text size="sm" mt="2w">
                Henry Hostein Président du conseil syndical
              </Text>

              <Box mt="3w">
                <InterviewsVideos />
              </Box>
            </Box>
          </ResponsiveRow>
        </Box>
      </Box>

      <Box py="10w" id="obligations-de-raccordement">
        <ObligationRaccordement />
      </Box>

      <Box py="10w" backgroundColor="blue-france-975-75" id="articles">
        <Box className="fr-container">
          <Heading as="h2" center>
            Nos articles sur le chauffage urbain
          </Heading>
          <Box className="fr-grid-row" mt="10w">
            <Understanding cards={coproprietaireCards} />
          </Box>
        </Box>
      </Box>

      <Box py="10w" id="actus">
        <Box className="fr-container">
          <Heading as="h2" center>
            Nos actualités
          </Heading>
          <Box className="fr-grid-row" mt="10w">
            <LastArticles />
          </Box>
        </Box>
      </Box>

      <Partners />

      <Box py="10w" backgroundColor="blue-france-main-525" textColor="#fff">
        <ReduireImpact />
      </Box>
    </SimplePage>
  );
}
