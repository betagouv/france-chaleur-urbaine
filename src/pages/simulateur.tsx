import { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import dynamic from 'next/dynamic';
import React from 'react';

import SimplePage from '@components/shared/page/SimplePage';
import Placeholder from '@components/SimulatorPublicodes/Placeholder';

const PublicodesSimulator = dynamic(() => import('@components/SimulatorPublicodes'), {
  ssr: false,
  loading: () => <Placeholder />,
});

const SimulateurPage: React.FC<InferGetServerSidePropsType<typeof getServerSideProps>> = ({ query }) => {
  return (
    <SimplePage title="Simulateur : France Chaleur Urbaine">
      <PublicodesSimulator tabId={query.tabId} displayMode={query.displayMode} />
    </SimplePage>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  return { props: { query: context.query } };
};

export default SimulateurPage;
