import dynamic from 'next/dynamic';

import Advantages from '@/components/Coproprietaire/Advantages';
import CoproGuide from '@/components/Coproprietaire/CoproGuide';
import Informations from '@/components/Coproprietaire/Informations';
import InterviewsVideos from '@/components/Coproprietaire/InterviewsVideos';
import { ArrowItem } from '@/components/MarkdownWrapper/MarkdownWrapper.style';
import StickyForm from '@/components/StickyForm/StickyForm';
import Box, { ResponsiveRow } from '@/components/ui/Box';
import Heading from '@/components/ui/Heading';
import Hero, { HeroMeta, HeroTitle } from '@/components/ui/Hero';
import Link from '@/components/ui/Link';
import Text from '@/components/ui/Text';
import WrappedText from '@/components/WrappedText';
import userExperience from '@/data/villes/user-experience';
import citiesData from '@/data/villes/villes';
import type { Network } from '@/types/Summary/Network';

import { CityContainer, VideoGuideColumn } from './City.styles';
import ClassedNetworks from './ClassedNetworks';
import Dispositifs, { type DispositifsData } from './Dispositifs';
import Networks from './Networks';

const Simulator = dynamic(() => import('@/modules/simulator/client/Simulator'), {
  ssr: false,
});

const City = ({ citySlug, network }: { citySlug: keyof typeof citiesData; network?: Network }) => {
  const cityData = citiesData[citySlug];
  const hasUniqueNetwork = !!cityData.networksData?.identifiant;

  return (
    <CityContainer>
      {cityData && (
        <>
          <Hero image={`/img/banner_ville_${citySlug}.jpg`} variant="city" className="py-5w" imageClassName="w-screen">
            <HeroMeta>Vous êtes copropriétaire sur {cityData.name} ?</HeroMeta>
            <HeroTitle className="[&&]:font-normal!">
              {/* Use && to bypass DSFR !important by adding specificity*/}
              Le chauffage urbain, une solution <strong>écologique</strong> et <strong>économique</strong> à {cityData.name}
            </HeroTitle>
          </Hero>
          <StickyForm title={`Votre bâtiment est-il raccordable au réseau de chaleur de ${cityData.name} ?`} />
          <Box p="4w" className="fr-container">
            <Box color="blue-france">
              <Heading as="h2" color="blue-france">
                {hasUniqueNetwork ? `Votre réseau de chaleur ${cityData.preposition} ` : `Vos réseaux de chaleur ${cityData.preposition} `}
                <Text fontWeight="bold" legacyColor="lightblue" display="inline">
                  {cityData.nameNetwork}
                </Text>
              </Heading>
              <Box mb="4w">
                <Text as="div">{cityData.description}</Text>
              </Box>
            </Box>
            {cityData.networksData && (
              <Box p="2w">
                <Networks networksData={cityData.networksData} network={network} cityCoord={cityData.coord as [number, number]} />
              </Box>
            )}
          </Box>
          <Box p="8w" backgroundColor="#f9f8f6">
            <Box className="fr-container">
              <Advantages />
            </Box>
          </Box>
          <Box p="4w" backgroundColor="#4550e5">
            <Box className="fr-container" textColor="white">
              <Informations />
            </Box>
          </Box>
          <Box p="8w" className="fr-container">
            <ResponsiveRow>
              <VideoGuideColumn>
                <Heading as="h3" color="blue-france" size="h4">
                  Découvrez des témoignages sur le terrain
                </Heading>
                <InterviewsVideos />
              </VideoGuideColumn>
              <VideoGuideColumn>
                <Heading as="h3" color="blue-france" size="h4">
                  Le guide complet sur le raccordement
                </Heading>
                <CoproGuide guideClassName="fr-mb-0" />
              </VideoGuideColumn>
            </ResponsiveRow>
          </Box>
          {cityData.networksData?.isClassed && (
            <Box p="8w" backgroundColor="#f9f8f6">
              <ResponsiveRow className="fr-container">
                <ClassedNetworks
                  city={citySlug}
                  nameNetwork={cityData.nameNetwork}
                  allClassed={cityData.networksData?.allClassed}
                  isUniqueNetwork={hasUniqueNetwork}
                  hasDevelopmentPerimeter={cityData.networksData?.hasDevelopmentPerimeter}
                />
              </ResponsiveRow>
            </Box>
          )}
          <Box backgroundColor="#4550e5" p="8w">
            <Heading as="h2" legacyColor="white" center>
              Découvrez les dispositifs et les aides
              <br />
              auxquels vous avez droit sur {cityData.name}
            </Heading>
            {citySlug === 'paris' && (
              <Box p="4w">
                <Dispositifs
                  city={citySlug}
                  dispositifsTitle={cityData.dispositifsTitle}
                  dispositifs={cityData.dispositifs as DispositifsData[]}
                />
              </Box>
            )}
            <Box p="4w">
              <Box className="fr-container">
                <ResponsiveRow>
                  <Box flex>
                    <Box>
                      <ArrowItem color="white">
                        <Text>
                          Le coup de pouce <strong>«&nbsp;Chauffage des bâtiments résidentiels collectifs et tertiaires&nbsp;»</strong>{' '}
                          permet d’obtenir des aides financières conséquentes pour se raccorder.
                        </Text>
                      </ArrowItem>
                      <ArrowItem color="white">
                        <Text>
                          <strong style={{ backgroundColor: '#F8D86E', color: '#000091' }}>
                            Le coût du raccordement peut ainsi être réduit à quelques centaines d’euros par logement
                          </strong>{' '}
                          (en fonction de la situation du bâtiment et de ses besoins en chaleur).
                        </Text>
                      </ArrowItem>
                      <ArrowItem color="white">
                        <Text>
                          Différentes entreprises signataires de la charte « Chauffage des bâtiments résidentiels collectifs et tertiaires »
                          offrent cette prime. <br />
                          <strong>
                            Le montant de la prime peut significativement varier d’une entreprise à l’autre, il est donc important de
                            comparer les offres proposées.
                          </strong>
                        </Text>
                      </ArrowItem>
                    </Box>
                    <Box ml="4w" mt="1w">
                      <Link href="/ressources/aides#contenu" variant="primary">
                        Tout savoir sur cette aide
                      </Link>
                    </Box>
                  </Box>
                  <Box flex maxWidth="40%">
                    <Simulator />
                  </Box>
                </ResponsiveRow>
              </Box>
            </Box>
            {citySlug !== 'paris' && cityData.dispositifs && (
              <Box p="4w">
                <Dispositifs
                  city={citySlug}
                  dispositifsTitle={cityData.dispositifsTitle}
                  dispositifs={cityData.dispositifs as DispositifsData[]}
                />
              </Box>
            )}
          </Box>

          <Box p="8w" backgroundColor="#f9f8f6">
            <Heading as="h2" color="blue-france" center>
              Les différentes étapes en copropriété :
            </Heading>
            <Box display="flex" flexDirection="column" className="fr-container">
              {userExperience.map((props) => (
                <Box
                  key={`box-user-experience-${props.imgSrc}`}
                  display="flex"
                  flexDirection="row"
                  alignItems="center"
                  justifyContent="space-between"
                  position="relative"
                >
                  <WrappedText
                    markdown={false}
                    textClassName="user-experience-description"
                    key={`user-experience-${props.imgSrc}`}
                    center
                    {...props}
                  />
                </Box>
              ))}
            </Box>
          </Box>
        </>
      )}
    </CityContainer>
  );
};

export default City;
