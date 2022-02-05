import MainLayout, {
  footerHeight,
  headerHeight,
} from '@components/shared/layout/MainLayout';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import React from 'react';
import styled from 'styled-components';

const MapWrapper = styled.div`
  height: calc(100vh - ${headerHeight} - ${footerHeight});
`;

function LegalMentions() {
  const MapWithNoSSR = dynamic(() => import('@components/Map'), {
    ssr: false,
  });

  return (
    <>
      <Head>
        <title>Carte des réseaux : France Chaleur Urbaine</title>
      </Head>
      <MainLayout currentMenu="/carte">
        <MapWrapper>
          <MapWithNoSSR />
        </MapWrapper>
      </MainLayout>
    </>
  );
}

export default LegalMentions;
