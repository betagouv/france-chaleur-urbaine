import { useCallback, useEffect, useState } from 'react';

import Advantages from '@components/Coproprietaire/Advantages';
import CoproGuide from '@components/Coproprietaire/CoproGuide';
import Informations from '@components/Coproprietaire/Informations';
import InterviewsVideos from '@components/Coproprietaire/InterviewsVideos';
import Simulators from '@components/Coproprietaire/Simulators';
import MarkdownWrapper from '@components/MarkdownWrapper';
import Slice from '@components/Slice';
import StickyForm from '@components/StickyForm/StickyForm';
import WrappedText from '@components/WrappedText';
import userExperience from '@data/villes/user-experience';
import citiesData from '@data/villes/villes';
import { useServices } from 'src/services';
import { Network } from 'src/types/Summary/Network';

import {
  CityContainer,
  CityDescriptionContainer,
  DispositifsSlice,
  VideoGuideColumn,
  SimulatorsContainer,
  Subtitle,
  Title,
} from './City.styles';
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
          <Slice padding={4}>
            <CityDescriptionContainer>
              <Title>
                {isUniqueNetwork ? 'Votre réseau de chaleur ' : 'Vos réseaux de chaleur '}
                {city === 'strasbourg' ? 'sur ' : 'à '}
                <b>{cityData.nameNetwork}</b>
              </Title>
              <MarkdownWrapper value={cityData.description} />
            </CityDescriptionContainer>
            {cityData.networksData && (
              <Slice padding={4}>
                <Networks networksData={cityData.networksData} network={network} cityCoord={cityData.coord as [number, number]}></Networks>
              </Slice>
            )}
          </Slice>
          <Slice padding={8} theme="grey">
            <Advantages />
          </Slice>
          <Slice padding={4} theme="color">
            <Informations />
          </Slice>
          <Slice padding={8} direction="row">
            <VideoGuideColumn>
              <Subtitle>Découvrez des témoignages sur le terrain</Subtitle>
              <InterviewsVideos />
            </VideoGuideColumn>
            <VideoGuideColumn>
              <Subtitle>Le guide complet sur le raccordement</Subtitle>
              <CoproGuide guideClassName="fr-mb-0" />
            </VideoGuideColumn>
          </Slice>
          {cityData.networksData && cityData.networksData.isClassed && (
            <Slice theme="grey" padding={8} direction="row">
              <ClassedNetworks
                city={city}
                nameNetwork={cityData.nameNetwork}
                allClassed={cityData.networksData?.allClassed}
                isUniqueNetwork={isUniqueNetwork}
                hasDevelopmentPerimeter={cityData.networksData?.hasDevelopmentPerimeter}
              />
            </Slice>
          )}
          <DispositifsSlice>
            <Slice
              theme="color"
              padding={8}
              header={`## Découvrez les dispositifs et les aides auxquels vous avez droit sur ${cityData.name}`}
            >
              {city === 'paris' && (
                <Slice padding={8}>
                  <Dispositifs
                    city={city}
                    dispositifsTitle={cityData.dispositifsTitle}
                    dispositifs={cityData.dispositifs as DispositifsData[]}
                  />
                </Slice>
              )}
              <Slice padding={8}>
                <SimulatorsContainer>
                  <Simulators
                    textTitle="Le coup de pouce « Chauffage des bâtiments résidentiels collectifs et tertiaires »"
                    simulatorTitle="Estimez le coup de pouce pour votre résidence"
                  />
                </SimulatorsContainer>
              </Slice>
              {city !== 'paris' && cityData.dispositifs && (
                <Slice padding={8}>
                  <Dispositifs
                    city={city}
                    dispositifsTitle={cityData.dispositifsTitle}
                    dispositifs={cityData.dispositifs as DispositifsData[]}
                  />
                </Slice>
              )}
            </Slice>
          </DispositifsSlice>
          <Slice theme="grey" padding={8} header="## Les différentes étapes en copropriété :">
            {userExperience.map((props, i) => (
              <WrappedText key={`user-experience-${i}`} textClassName="user-experience-description" center {...props} />
            ))}
          </Slice>
        </>
      )}
    </CityContainer>
  );
};

export default City;
