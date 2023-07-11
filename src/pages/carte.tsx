import Map from '@components/Map';
import MainContainer, {
  fullscreenHeaderHeight,
  tabHeaderHeight,
} from '@components/shared/layout';
import Head from 'next/head';
import { useState } from 'react';
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
  const [proMode, setProMode] = useState(false);
  return (
    <>
      <Head>
        <title>Carte des réseaux : France Chaleur Urbaine</title>
      </Head>
      <MainContainer currentMenu="/carte" fullscreen>
        <MapWrapper>
          <Map
            withoutLogo
            withDrawing={proMode}
            withLegend
            initialLayerDisplay={{
              outline: true,
              futurOutline: false,
              coldOutline: false,
              zoneDP: false,
              demands: false,
              raccordements: false,
              gasUsageGroup: false,
              buildings: false,
              gasUsage: [],
              energy: [],
              gasUsageValues: [1000, Number.MAX_VALUE],
              energyGasValues: [50, Number.MAX_VALUE],
              energyFuelValues: [50, Number.MAX_VALUE],
            }}
            setProMode={setProMode}
            legendData={
              proMode
                ? undefined
                : param.legendData.filter(
                    (x) =>
                      typeof x !== 'string' && defaultLegendIds.includes(x.id)
                  )
            }
          />
        </MapWrapper>
      </MainContainer>
    </>
  );
};

export default Carte;
