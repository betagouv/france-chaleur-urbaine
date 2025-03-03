import { type GetServerSideProps, type InferGetServerSidePropsType } from 'next';
import dynamic from 'next/dynamic';
import React from 'react';

import Placeholder, { ComparateurPublicodesTitle } from '@/components/ComparateurPublicodes/Placeholder';
import SimplePage from '@/components/shared/page/SimplePage';
import { withAuthentication } from '@/server/authentication';

const ComparateurPublicodes = dynamic(() => import('@/components/ComparateurPublicodes'), {
  // Publicode engine takes 2s to load and is unnecessary on the server side
  ssr: false,
  loading: () => <Placeholder />,
});

const SimulateurPage: React.FC<InferGetServerSidePropsType<typeof getServerSideProps>> = ({ query }) => {
  return (
    <SimplePage
      noIndex={process.env.NEXT_PUBLIC_FLAG_ENABLE_COMPARATEUR !== 'true'}
      title="Comparateur des performances des modes de chauffage et de refroidissement"
      description="Comparez le coût et les émissions de CO2 des réseaux de chaleur, fioul, gaz et électricité pour votre adresse et vos caractéristiques"
      mode="authenticated"
    >
      <ComparateurPublicodesTitle />
      <ComparateurPublicodes tabId={query.tabId} displayMode="technicien" />
    </SimplePage>
  );
};

export default SimulateurPage;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const res = await withAuthentication('professionnel')(context);
  return 'redirect' in res ? res : { props: { ...(res as any).props, query: context.query } };
};
