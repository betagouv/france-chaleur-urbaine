import Map from '@components/Map';
import {
  fullscreenHeaderHeight,
  tabHeaderHeight,
} from '@components/shared/layout/MainLayout.data';
import SimplePage from '@components/shared/page/SimplePage';
import { usePersistedState } from '@hooks';
import param from 'src/services/Map/param';
import { LegendGroupId } from 'src/types/enum/LegendGroupId';
import styled from 'styled-components';

const MapWrapper = styled.div`
  height: calc(100vh - ${tabHeaderHeight});

  @media (min-width: 992px) {
    height: calc(100vh - ${fullscreenHeaderHeight});
  }
`;

const defaultLegendIds = [
  LegendGroupId.heatNetwork,
  LegendGroupId.coldNetwork,
  LegendGroupId.zoneDP,
  LegendGroupId.futurheatNetwork,
];

const Carte = () => {
  const [proMode, setProMode] = usePersistedState('mapProMode', false, {
    beforeStorage: (value) => value || false,
  });

  return (
    <SimplePage
      title="Carte des réseaux : France Chaleur Urbaine"
      mode="public-fullscreen"
    >
      <MapWrapper>
        <Map
          withoutLogo
          withDrawing={proMode}
          withLegend
          initialLayerDisplay={param.defaultLayerDisplay}
          proMode={proMode}
          setProMode={setProMode}
          legendData={
            proMode
              ? param.legendData.filter((x) => x !== 'proModeLegend')
              : param.legendData
                  .filter(
                    (legend) =>
                      legend !== 'contributeButton' &&
                      legend !== 'statsByArea' &&
                      (typeof legend === 'string' ||
                        defaultLegendIds.includes(legend.id))
                  )
                  .filter(
                    (legend, i, legends) =>
                      legend !== 'separator' || legends[i - 1] !== 'separator'
                  )
          }
        />
      </MapWrapper>
    </SimplePage>
  );
};

export default Carte;
