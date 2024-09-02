import { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import React from 'react';

import SimplePage from '@components/shared/page/SimplePage';
import PublicodesSimulator from '@components/SimulatorPublicodes';

const SimulateurPage: React.FC<InferGetServerSidePropsType<typeof getServerSideProps>> = ({ query }) => {
  return (
    <SimplePage title="Simulateur : France Chaleur Urbaine">
      {/* don't load all publicodes on the server */}
      {typeof window !== 'undefined' ? <PublicodesSimulator tabId={query.tabId} displayMode={query.displayMode} /> : <></>}
    </SimplePage>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  return { props: { query: context.query } };
};

export default SimulateurPage;
