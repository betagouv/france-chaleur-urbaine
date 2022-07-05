import Map from '@components/Map';
import MainContainer from '@components/shared/layout';
import {
  fullscreenHeaderHeight,
  tabHeaderHeight,
} from '@components/shared/layout/MainLayout';
import Head from 'next/head';
import styled from 'styled-components';

const MapWrapper = styled.div`
  height: calc(100vh - ${tabHeaderHeight});

  @media (min-width: 992px) {
    height: calc(100vh - ${fullscreenHeaderHeight});
  }
`;

function LegalMentions() {
  return (
    <>
      <Head>
        <title>Carte des réseaux : France Chaleur Urbaine</title>
      </Head>
      <MainContainer currentMenu="/carte" fullscreen>
        <MapWrapper>
          <Map />
        </MapWrapper>
      </MainContainer>
    </>
  );
}

export default LegalMentions;
