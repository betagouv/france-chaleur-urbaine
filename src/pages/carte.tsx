import Map from '@components/Map';
import { mapLegendFeatures } from '@components/Map/components/SimpleMapLegend';
import {
  fullscreenHeaderHeight,
  tabHeaderHeight,
} from '@components/shared/layout/MainLayout.data';
import SimplePage from '@components/shared/page/SimplePage';
import useURLParamOrLocalStorage, {
  parseAsBoolean,
} from '@hooks/useURLParamOrLocalStorage'; // parseAsBoolean,
import useInitialSearchParam from '@hooks/useInitialSearchParam';
import { setProperty } from '@utils/core';
import {
  MapConfigurationProperty,
  createMapConfiguration,
  defaultMapConfiguration,
} from 'src/services/Map/map-configuration';
import styled from 'styled-components';

const MapWrapper = styled.div`
  height: calc(100vh - ${tabHeaderHeight});
  height: calc(100dvh - ${tabHeaderHeight});

  @media (min-width: 992px) {
    height: calc(100vh - ${fullscreenHeaderHeight});
    height: calc(100dvh - ${fullscreenHeaderHeight});
  }
`;

export const layerURLKeysToMapConfigPath = {
  reseauxDeChaleur: 'reseauxDeChaleur',
  reseauxDeFroid: 'reseauxDeFroid',
  reseauxEnConstruction: 'reseauxEnConstruction',
  zonesDeDeveloppementPrioritaire: 'zonesDeDeveloppementPrioritaire',
  demandesEligibilite: 'demandesEligibilite',
  consommationsGaz: 'consommationsGaz.show',
  batimentsGazCollectif: 'batimentsGazCollectif.show',
  batimentsFioulCollectif: 'batimentsFioulCollectif.show',
  batimentsRaccordes: 'batimentsRaccordes',
  zonesOpportunite: 'zonesOpportunite.show',
  caracteristiquesBatiments: 'caracteristiquesBatiments',
} as const satisfies { [key: string]: MapConfigurationProperty };

export type LayerURLKey = keyof typeof layerURLKeysToMapConfigPath;

export const layerURLKeys = Object.keys(
  layerURLKeysToMapConfigPath
) as ReadonlyArray<LayerURLKey>;

const Carte = () => {
  // read the pro mode from the URL or get the local storage value
  const [proMode, setProMode] = useURLParamOrLocalStorage(
    'proMode',
    'mapProMode',
    false,
    parseAsBoolean
  );

  // amend the initial map configuration with additional layers
  const additionalLayersQuery = useInitialSearchParam('additionalLayers');
  const additionalLayers = additionalLayersQuery
    ? additionalLayersQuery
        .split(',')
        .filter((key) => layerURLKeys.includes(key as LayerURLKey))
        .map((key) => layerURLKeysToMapConfigPath[key as LayerURLKey])
    : [];
  const initialMapConfiguration = createMapConfiguration(
    defaultMapConfiguration
  );
  additionalLayers.forEach((updateKey) => {
    setProperty(initialMapConfiguration, updateKey, true);
  });

  return (
    <SimplePage
      title="Carte des réseaux : France Chaleur Urbaine"
      mode="public-fullscreen"
    >
      <MapWrapper>
        {proMode !== null && (
          <Map
            withoutLogo
            withDrawing={proMode}
            withLegend
            proMode={proMode}
            setProMode={setProMode}
            initialMapConfiguration={initialMapConfiguration}
            enabledLegendFeatures={
              proMode
                ? mapLegendFeatures.filter((f) => f !== 'proModeLegend')
                : [
                    'reseauxDeChaleur',
                    'reseauxDeFroid',
                    'reseauxEnConstruction',
                    'zonesDeDeveloppementPrioritaire',
                    'proModeLegend',
                  ]
            }
            persistViewStateInURL
          />
        )}
      </MapWrapper>
    </SimplePage>
  );
};

export default Carte;
