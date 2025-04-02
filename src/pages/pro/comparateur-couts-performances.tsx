import { type GetServerSidePropsContext, type InferGetServerSidePropsType } from 'next';
import dynamic from 'next/dynamic';
import React from 'react';

import Placeholder, { Explanations, Logos, title } from '@/components/ComparateurPublicodes/Placeholder';
import SimplePage from '@/components/shared/page/SimplePage';
import Hero, { HeroContent, HeroTitle } from '@/components/ui/Hero';
import { withAuthentication } from '@/server/authentication';

const ComparateurPublicodes = dynamic(() => import('@/components/ComparateurPublicodes'), {
  // Publicode engine takes 2s to load and is unnecessary on the server side
  ssr: false,
  loading: () => <Placeholder advancedMode={true} />,
});

const SimulateurPage: React.FC<InferGetServerSidePropsType<typeof getServerSideProps>> = ({ query }) => {
  return (
    <SimplePage
      noIndex={true}
      title="Comparateur des performances des modes de chauffage et de refroidissement"
      description="Comparez le coût et les émissions de CO2 des réseaux de chaleur, fioul, gaz et électricité pour votre adresse et vos caractéristiques"
      mode="authenticated"
    >
      <Hero variant="transparent" className="[&_article]:pb-0">
        <HeroTitle>{title}</HeroTitle>
        <HeroContent>
          <Logos size="sm" withFCU={false} />
          <Explanations advancedMode={true} />
        </HeroContent>
      </Hero>
      <ComparateurPublicodes tabId={query.tabId} advancedMode={true} />
    </SimplePage>
  );
};

export default SimulateurPage;

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  const res = await withAuthentication(['particulier', 'professionnel', 'gestionnaire', 'admin', 'demo'])(context);
  return 'redirect' in res ? res : { props: { ...(res as any).props, query: context.query } };
};
