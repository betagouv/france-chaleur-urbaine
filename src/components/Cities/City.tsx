import Advantages from '@/components/Coproprietaire/Advantages';
import CoproGuide from '@/components/Coproprietaire/CoproGuide';
import Informations from '@/components/Coproprietaire/Informations';
import InterviewsVideos from '@/components/Coproprietaire/InterviewsVideos';
import Simulators from '@/components/Coproprietaire/Simulators';
import StickyForm from '@/components/StickyForm/StickyForm';
import Box, { ResponsiveRow } from '@/components/ui/Box';
import Heading from '@/components/ui/Heading';
import Hero, { HeroMeta, HeroTitle } from '@/components/ui/Hero';
import Text from '@/components/ui/Text';
import WrappedText from '@/components/WrappedText';
import userExperience from '@/data/villes/user-experience';
import citiesData from '@/data/villes/villes';
import type { Network } from '@/types/Summary/Network';

import { CityContainer, VideoGuideColumn } from './City.styles';
import ClassedNetworks from './ClassedNetworks';
import Dispositifs, { type DispositifsData } from './Dispositifs';
import Networks from './Networks';

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
                <Text as="div" legacyColor="darkblue">
                  {cityData.description}
                </Text>
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
              <Simulators
                textTitle="Le coup de pouce « Chauffage des bâtiments résidentiels collectifs et tertiaires »"
                simulatorTitle="Estimez le coup de pouce pour votre résidence"
                simulatorResultColor="var(--blue-france-sun-113-625)"
                simulatorResultBackgroundColor="#F8D86E"
                simulatorBackgroundColor="var(--blue-france-main-525)"
                simulatorDisclaimerLegacyColor="white"
              />
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
