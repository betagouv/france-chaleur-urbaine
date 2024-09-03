import { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import React from 'react';

import SimplePage from '@components/shared/page/SimplePage';
import PublicodesSimulator from '@components/SimulatorPublicodes';

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
