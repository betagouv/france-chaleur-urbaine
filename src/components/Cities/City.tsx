import Advantages from '@components/Coproprietaire/Advantages';
import Informations from '@components/Coproprietaire/Informations';
import Slice from '@components/Slice';
import Header from './Header';
import MarkdownWrapper from '@components/MarkdownWrapper';
import { matomoEvent } from '@components/Markup';
import StickyForm from '@components/StickyForm/StickyForm';
import {
  CityContainer,
  VideoGuideColumn,
  SimulatorsContainer,
  Subtitle,
  Title,
} from './City.styles';
import WrappedText from '@components/WrappedText';
import { userExperience, villesData } from '@data/villes';
import Simulators from '@components/Coproprietaire/Simulators';
import Dispositifs, { DispositifsData } from './Dispositifs';
import Networks from './Networks';
import { Network } from 'src/types/Summary/Network';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@dataesr/react-dsfr';
import { useServices } from 'src/services';
import InterviewsVideos from '@components/Coproprietaire/InterviewsVideos';

const getCityData = (city: string) => {
  const cityData = villesData.find(
    (ville: any) => ville.name.toLowerCase() == city.toLowerCase()
  );
  return cityData;
};

const City = ({ city }: { city: string }) => {
  const [network, setNetwork] = useState<Network>();
  const { heatNetworkService } = useServices();
  const [cityCoord, setCityCoord] = useState<[number, number]>();
  const { suggestionService } = useServices();
  const cityData = getCityData(city);

  const getNetworkFromDB = useCallback(
    async (identifiant: string): Promise<void> => {
      if (!identifiant) {
        return;
      }

      const networkData =
        await heatNetworkService.findByIdentifiant(identifiant);
      if (networkData) {
        setNetwork(networkData);
      }
    },
    [heatNetworkService]
  );

  const getCityAddress = useCallback(
    async (city: string): Promise<void> => {
      if (!city) {
        return;
      }

      const fetchedSuggestions = await suggestionService.fetchSuggestions(
        city,
        {
          limit: '1',
          type: 'municipality',
        }
      );
      if (
        fetchedSuggestions &&
        fetchedSuggestions.features.length > 0 &&
        fetchedSuggestions.features[0].geometry.coordinates
      ) {
        setCityCoord(fetchedSuggestions.features[0].geometry.coordinates);
      }
    },
    [suggestionService]
  );

  useEffect(() => {
    if (cityData && cityData.networksData.identifiant && !network) {
      getNetworkFromDB(cityData.networksData.identifiant);
    }
  }, [cityData, getNetworkFromDB, network]);

  useEffect(() => {
    if (city && !cityCoord) {
      getCityAddress(city);
    }
  }, [city, cityCoord, getCityAddress]);

  return (
    <CityContainer>
      {cityData && (
        <>
          <Header
            city={cityData.name}
            bannerSrc={`/img/banner_ville_${city}.jpg`}
            bannerPos={
              city == 'metz' || city == 'nantes' ? 'right bottom' : undefined
            }
          />
          <StickyForm
            title={`Votre bâtiment est-il raccordable au réseau de chaleur de ${cityData.name} ?`}
          />
          <Slice padding={4}>
            <Title>
              Votre réseau de chaleur à <b>{cityData.nameNetwork}</b>
            </Title>
            <MarkdownWrapper
              value={cityData.description}
              className="city-description"
            />
            {cityData.networksData && (
              <Slice padding={4}>
                <Networks
                  networksData={cityData.networksData}
                  network={network}
                  cityCoord={cityCoord}
                ></Networks>
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
              <div className="fcuCoproGuide">
                <img src="/img/copro_guide.png" alt="Guide de raccordement" />
                <div>
                  <Button
                    onClick={() => {
                      matomoEvent([
                        'Téléchargement',
                        'Guide FCU',
                        'coproprietaire',
                      ]);
                      window.open(
                        '/documentation/guide-france-chaleur-urbaine.pdf',
                        '_blank'
                      );
                    }}
                  >
                    Télécharger notre guide
                  </Button>
                </div>
              </div>
            </VideoGuideColumn>
          </Slice>
          {cityData.networksData && cityData.networksData.isClassed && (
            <Slice
              theme="grey"
              padding={8}
              direction="row"
              className="city-classed-network"
            >
              <MarkdownWrapper
                withPadding
                value={`
  :::puce-icon{icon="/icons/picto-warning.svg"}
  Le réseau de ${cityData.name} est « classé », ce qui signifie que **certains bâtiments ont l'obligation de se raccorder**.

  Cette obligation s’applique dans une certaine zone autour du réseau, qualifiée de **périmètre de développement prioritaire.**

  :button-link[Voir le périmètre de développement prioritaire]{href="/carte" className="fr-btn--sm fr-mt-2w"}
    `}
              />
              <MarkdownWrapper
                withPadding
                value={`
  **Sont concernés :**
  ::arrow-item[Tout bâtiment neuf dont les besoins de chauffage sont supérieurs à 100kW]
  ::arrow-item[Tout bâtiment renouvelant son installation de chauffage au-dessus de 100kW]
    `}
              />
            </Slice>
          )}
          <Slice
            theme="color"
            padding={8}
            header={`## Découvrez les dispositifs et les aides auxquels vous avez droit sur ${cityData.name}`}
            className="city-dispositifs-block"
          >
            {city == 'paris' && (
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
            {city != 'paris' && cityData.dispositifs && (
              <Slice padding={8}>
                <Dispositifs
                  city={city}
                  dispositifsTitle={cityData.dispositifsTitle}
                  dispositifs={cityData.dispositifs as DispositifsData[]}
                />
              </Slice>
            )}
          </Slice>
          <Slice
            theme="grey"
            padding={8}
            header="## Les différentes étapes en copropriété :"
          >
            {userExperience.map((props, i) => (
              <WrappedText
                key={`user-experience-${i}`}
                textClassName="user-experience-description"
                center
                {...props}
              />
            ))}
          </Slice>
        </>
      )}
    </CityContainer>
  );
};

export default City;
