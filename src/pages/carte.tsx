import Map from '@components/Map';
import MainContainer, {
  fullscreenHeaderHeight,
  tabHeaderHeight,
} from '@components/shared/layout';
import Head from 'next/head';
import styled from 'styled-components';

const MapWrapper = styled.div`
  height: calc(100vh - ${tabHeaderHeight});

  @media (min-width: 992px) {
    height: calc(100vh - ${fullscreenHeaderHeight});
  }

  @media (max-width: 1225px) {
    display: none;
  }
`;

const NotAvailable = styled.h2`
  display: none;
  margin: auto;
  padding: 32px;
  @media (max-width: 1225px) {
    display: block;
  }
`;

function LegalMentions() {
  return (
    <>
      <Head>
        <title>Carte des réseaux : France Chaleur Urbaine</title>
      </Head>
      <MainContainer currentMenu="/carte" fullscreen>
        <NotAvailable>
          Notre cartographie n'est pas encore disponible en version mobile
        </NotAvailable>
        <MapWrapper>
          <Map />
        </MapWrapper>
      </MainContainer>
    </>
  );
}

export default LegalMentions;
