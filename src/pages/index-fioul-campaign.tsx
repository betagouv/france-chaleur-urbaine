import Image from 'next/image';

import AvantagesChauffageUrbain from '@/components/GenericContent/AvantagesChauffageUrbain';
import ComparatifChauffage from '@/components/GenericContent/ComparatifChauffages';
import CoutsChauffageUrbain from '@/components/GenericContent/CoutsChauffageUrbain';
import HowToRaccordement from '@/components/GenericContent/HowToRaccordement';
import ObligationRaccordement from '@/components/GenericContent/ObligationRaccordement';
import HeadSliceForm from '@/components/HeadSliceForm';
import SimplePage from '@/components/shared/page/SimplePage';
import Box, { ResponsiveRow } from '@/components/ui/Box';
import Heading from '@/components/ui/Heading';
import Link from '@/components/ui/Link';
import Text from '@/components/ui/Text';

export default function Home() {
  return (
    <SimplePage
      title="Changez votre chaudière fioul pour le chauffage urbain"
      description="Stabilité des tarifs, Amélioration de l'étiquette DPE, Faibles émissions de gaz à effet de serre"
    >
      <HeadSliceForm
        checkEligibility
        withWrapper={(form) => (
          <Box backgroundColor="#C3E4E1">
            <Box display="flex" alignItems="stretch" gap="16px">
              <Box flex className="fr-hidden fr-unhidden-lg" alignItems="stretch">
                <Image
                  src="/img/banner_chauffage_gaz.png"
                  alt=""
                  width={0}
                  height={0}
                  sizes="100vw"
                  style={{ width: 'auto', height: '100%' }}
                  className="img-object-cover max-w-none"
                />
              </Box>
              <Box flex py="3w" pr="8w" className="fr-container">
                <Heading as="h1" size="h2" color="blue-france" mt="1w">
                  Changez votre chaudière fioul pour le chauffage urbain et maîtrisez vos factures
                </Heading>
                <Text mb="2w">Testez votre éligibilité en 2 clics&nbsp;!</Text>
                {form}
              </Box>
            </Box>
          </Box>
        )}
      />

      <Box py="10w" id="avantages-du-chauffage-urbain">
        <AvantagesChauffageUrbain title="Les avantages du chauffage urbain par rapport au fioul" />
      </Box>

      <Box py="10w" id="comprendre-le-chauffage-urbain" backgroundColor="blue-france-975-75">
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
                <strong>distribuer de la chaleur produite de façon centralisée à un ensemble de bâtiments</strong>, via des canalisations
                souterraines. On parle aussi de réseaux de chaleur.{' '}
                <strong>
                  Ces réseaux sont alimentés à plus de 66% par des{' '}
                  <Link href="/ressources/energies-vertes#contenu">énergies renouvelables et de récupération locales</Link>.
                </strong>
              </Text>
              <Text size="lg" mt="3w">
                La chaleur est transportée jusqu'à une sous-station installée dans votre copropriété, puis acheminée aux différents
                logements par des canalisations internes à l’immeuble.
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

      <Box py="10w" id="couts-du-chauffage-urbain">
        <CoutsChauffageUrbain />
      </Box>

      <Box py="10w" backgroundColor="blue-france-975-75">
        <ComparatifChauffage />
      </Box>

      <Box py="10w" backgroundColor="blue-france-main-525" id="comment-se-raccorder">
        <HowToRaccordement downloadLinkPos="right" />
      </Box>

      <Box py="10w" id="obligations-de-raccordement">
        <ObligationRaccordement />
      </Box>
    </SimplePage>
  );
}
