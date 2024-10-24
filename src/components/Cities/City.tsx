import { useCallback, useEffect, useState } from 'react';

import Advantages from '@components/Coproprietaire/Advantages';
import CoproGuide from '@components/Coproprietaire/CoproGuide';
import Informations from '@components/Coproprietaire/Informations';
import InterviewsVideos from '@components/Coproprietaire/InterviewsVideos';
import Simulators from '@components/Coproprietaire/Simulators';
import StickyForm from '@components/StickyForm/StickyForm';
import Box, { ResponsiveRow } from '@components/ui/Box';
import Heading from '@components/ui/Heading';
import Text from '@components/ui/Text';
import WrappedText from '@components/WrappedText';
import userExperience from '@data/villes/user-experience';
import citiesData from '@data/villes/villes';
import { useServices } from 'src/services';
import { Network } from 'src/types/Summary/Network';

import { CityContainer, VideoGuideColumn } from './City.styles';
import ClassedNetworks from './ClassedNetworks';
import Dispositifs, { DispositifsData } from './Dispositifs';
import Header from './Header';
import Networks from './Networks';

const City = ({ city }: { city: string }) => {
  const [network, setNetwork] = useState<Network>();
  const { heatNetworkService } = useServices();
  const cityData = citiesData[city.toLowerCase()];
  const [isUniqueNetwork, setIsUniqueNetwork] = useState<boolean>(false);

  const getNetworkFromDB = useCallback(
    async (identifiant: string): Promise<void> => {
      if (!identifiant) {
        return;
      }

      const networkData = await heatNetworkService.findByIdentifiant(identifiant);
      if (networkData) {
        setNetwork(networkData);
      }
    },
    [heatNetworkService]
  );

  useEffect(() => {
    if (cityData && cityData.networksData.identifiant) {
      setIsUniqueNetwork(true);
      if (!network) {
        getNetworkFromDB(cityData.networksData.identifiant);
      }
    }
  }, [cityData, getNetworkFromDB, network]);

  return (
    <CityContainer>
      {cityData && (
        <>
          <Header city={cityData.name} bannerSrc={`/img/banner_ville_${city}.jpg`} />
          <StickyForm title={`Votre bâtiment est-il raccordable au réseau de chaleur de ${cityData.name} ?`} />
          <Box p="4w" className="fr-container">
            <Box color="blue-france">
              <Heading as="h2" color="blue-france">
                {isUniqueNetwork ? 'Votre réseau de chaleur ' : 'Vos réseaux de chaleur '}
                {city === 'strasbourg' ? 'sur ' : 'à '}
                <Text fontWeight="bold" legacyColor="lightblue" display="inline">
                  {cityData.nameNetwork}
                </Text>
              </Heading>
              <Box mb="4w">
                <Text legacyColor="darkblue">{cityData.description}</Text>
              </Box>
            </Box>
            {cityData.networksData && (
              <Box p="2w">
                <Networks networksData={cityData.networksData} network={network} cityCoord={cityData.coord as [number, number]}></Networks>
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
          {cityData.networksData && cityData.networksData.isClassed && (
            <Box p="8w" backgroundColor="#f9f8f6">
              <ResponsiveRow className="fr-container">
                <ClassedNetworks
                  city={city}
                  nameNetwork={cityData.nameNetwork}
                  allClassed={cityData.networksData?.allClassed}
                  isUniqueNetwork={isUniqueNetwork}
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
            {city === 'paris' && (
              <Box p="4w">
                <Dispositifs
                  city={city}
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
            {city !== 'paris' && cityData.dispositifs && (
              <Box p="4w">
                <Dispositifs
                  city={city}
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
              {userExperience.map((props, i) => (
                <Box
                  key={`box-user-experience-${i}`}
                  display="flex"
                  flexDirection="row"
                  alignItems="center"
                  justifyContent="space-between"
                  position="relative"
                >
                  <WrappedText textClassName="user-experience-description" key={`user-experience-${i}`} center {...props} />
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
