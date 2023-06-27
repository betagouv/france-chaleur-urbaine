import Map from '@components/Map';
import MainContainer, {
  fullscreenHeaderHeight,
  tabHeaderHeight,
} from '@components/shared/layout';
import Head from 'next/head';
import param from 'src/services/Map/param';
import styled from 'styled-components';

const MapWrapper = styled.div`
  height: calc(100vh - ${tabHeaderHeight});

  @media (min-width: 992px) {
    height: calc(100vh - ${fullscreenHeaderHeight});
  }
`;

function carte() {
  return (
    <>
      <Head>
        <title>Carte des réseaux : France Chaleur Urbaine</title>
      </Head>
      <MainContainer currentMenu="/carte" fullscreen>
        <MapWrapper>
          <Map
            withoutLogo
            withDrawing
            withLegend
            initialLayerDisplay={param.defaultLayerDisplay}
          />
        </MapWrapper>
      </MainContainer>
    </>
  );
}

export default carte;
