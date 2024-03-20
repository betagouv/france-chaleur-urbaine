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
import styled from 'styled-components';

const MapWrapper = styled.div`
  height: calc(100vh - ${tabHeaderHeight});
  height: calc(100dvh - ${tabHeaderHeight});

  @media (min-width: 992px) {
    height: calc(100vh - ${fullscreenHeaderHeight});
    height: calc(100dvh - ${fullscreenHeaderHeight});
  }
`;

const Carte = () => {
  // read the pro mode from the URL or get the local storage value
  const [proMode, setProMode] = useURLParamOrLocalStorage(
    'proMode',
    'mapProMode',
    false,
    parseAsBoolean
  );

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
