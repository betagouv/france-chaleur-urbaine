import { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import dynamic from 'next/dynamic';
import React from 'react';

import Placeholder from '@components/ComparateurPublicodes/Placeholder';
import SimplePage from '@components/shared/page/SimplePage';

const PublicodesSimulator = dynamic(() => import('@components/ComparateurPublicodes'), {
  // Publicode engine takes 2s to load and is unnecessary on the server side
  ssr: false,
  loading: () => <Placeholder />,
});

const SimulateurPage: React.FC<InferGetServerSidePropsType<typeof getServerSideProps>> = ({ query }) => {
  return (
    <SimplePage title="Comparateur des performances des modes de chauffage et de refroidissement : France Chaleur Urbaine">
      <PublicodesSimulator tabId={query.tabId} displayMode={query.displayMode} />
    </SimplePage>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  return { props: { query: context.query } };
};

export default SimulateurPage;
