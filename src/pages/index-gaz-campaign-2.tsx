import ComparatifChauffage from '@components/GenericContent/ComparatifChauffages';
import CoutsChauffageUrbain from '@components/GenericContent/CoutsChauffageUrbain';
import HowToRaccordement from '@components/GenericContent/HowToRaccordement';
import ObligationRaccordement from '@components/GenericContent/ObligationRaccordement';
import StickyForm from '@components/StickyForm/StickyForm';
import SimplePage from '@components/shared/page/SimplePage';
import Box, { ResponsiveRow } from '@components/ui/Box';
import Heading from '@components/ui/Heading';
import Link from '@components/ui/Link';
import Text from '@components/ui/Text';
import Head from 'next/head';
import Image from 'next/image';

export default function Home() {
  return (
    <SimplePage title="France Chaleur Urbaine : Une solution numérique qui facilite le raccordement à un chauffage économique et écologique">
      <Head>
        <meta
          name="description"
          content="Un réseau de chaleur est un système de distribution de chaleur produite de façon centralisée qui permet de desservir un grand nombre d’usagers (bâtiments tertiaires publics ou privés, copropriétés, logements sociaux,...). Un des atouts majeurs des réseaux de chaleur est de permettre de mobiliser les énergies renouvelables présentes sur le territoire, difficilement distribuables autrement."
        />
      </Head>

      <Box pt="4w" pb="8w" backgroundColor="blue-france-975-75">
        <Box className="fr-container">
          <Heading as="h1" center color="blue-france">
            Changez votre chaudière gaz pour
            <br />
            le chauffage urbain
          </Heading>
          <Text size="lg" textAlign="center">
            Découvrez les nombreux avantages des réseaux de chaleur&nbsp;!
          </Text>
          <Box className="fr-grid-row fr-grid-row--gutters" mt="4w">
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              className="fr-col-12 fr-col-lg-6 fr-col-xl-3"
            >
              <Image
                src="/img/gaz_campaign_1.svg"
                alt=""
                width={164}
                height={119}
                priority
                className="img-object-contain"
              />
              <Text size="md" textAlign="center" mt="2w">
                Chauffage centralisé à l'échelle d'une ville ou d'un quartier
              </Text>
            </Box>

            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              className="fr-col-12 fr-col-lg-6 fr-col-xl-3"
            >
              <Image
                src="/img/gaz_campaign_2.svg"
                alt=""
                width={164}
                height={119}
                priority
                className="img-object-contain"
              />
              <Text size="md" textAlign="center" mt="2w">
                Stabilité des tarifs, subventions et TVA à 5,5%
              </Text>
            </Box>

            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              className="fr-col-12 fr-col-lg-6 fr-col-xl-3"
            >
              <Image
                src="/img/gaz_campaign_3.svg"
                alt=""
                width={164}
                height={119}
                priority
                className="img-object-contain"
              />
              <Text size="md" textAlign="center" mt="2w">
                Amélioration de l'étiquette DPE
              </Text>
            </Box>

            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              className="fr-col-12 fr-col-lg-6 fr-col-xl-3"
            >
              <Image
                src="/img/gaz_campaign_4.svg"
                alt=""
                width={164}
                height={119}
                priority
                className="img-object-contain"
              />
              <Text size="md" textAlign="center" mt="2w">
                Faibles émissions de gaz à effet de serre
              </Text>
            </Box>
          </Box>
        </Box>
      </Box>
      <StickyForm title="Testez en deux clics l'éligibilité de votre adresse" />

      <Box py="10w" id="comprendre-le-chauffage-urbain">
        <Box className="fr-container">
          <Heading as="h2" center>
            Comprendre le chauffage urbain
          </Heading>
          <ResponsiveRow mt="10w">
            <Box display="flex" flexDirection="column" alignItems="center" flex>
              <Heading as="h3" color="blue-france" mb="4w">
                Une alternative au fioul ou au gaz
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
              <Link variant="primary" href="reseaux-chaleur#contenu" mt="3w">
                En savoir plus
              </Link>
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
            </Box>
          </ResponsiveRow>
        </Box>
      </Box>

      <Box py="10w" backgroundColor="blue-france-975-75">
        <ComparatifChauffage />
      </Box>

      <Box py="10w" id="couts-du-chauffage-urbain">
        <CoutsChauffageUrbain />
      </Box>

      <Box
        py="10w"
        backgroundColor="blue-france-main-525"
        id="comment-se-raccorder"
      >
        <HowToRaccordement downloadLinkPos="right" />
      </Box>

      <Box py="10w" id="obligations-de-raccordement">
        <ObligationRaccordement />
      </Box>
    </SimplePage>
  );
}
