import { type GetServerSideProps, type InferGetServerSidePropsType } from 'next';
import dynamic from 'next/dynamic';
import React from 'react';

import { clientConfig } from '@/client-config';
import Placeholder, { Explanations, Logos, title } from '@/components/ComparateurPublicodes/Placeholder';
import SimplePage from '@/components/shared/page/SimplePage';
import Hero, { HeroContent, HeroTitle } from '@/components/ui/Hero';

const ComparateurPublicodes = dynamic(() => import('@/components/ComparateurPublicodes'), {
  // Publicode engine takes 2s to load and is unnecessary on the server side
  ssr: false,
  loading: () => <Placeholder />,
});

const SimulateurPage: React.FC<InferGetServerSidePropsType<typeof getServerSideProps>> = ({ query }) => {
  return (
    <SimplePage
      noIndex={!clientConfig.ENABLE_COMPARATEUR}
      title="Comparateur des performances des modes de chauffage et de refroidissement"
      description="Comparez le coût et les émissions de CO2 des réseaux de chaleur, fioul, gaz et électricité pour votre adresse et vos caractéristiques"
    >
      <Hero variant="transparent" className="[&_article]:pb-0">
        <HeroTitle>{title}</HeroTitle>
        <HeroContent>
          <Logos size="sm" withFCU={false} />
          <Explanations />
        </HeroContent>
      </Hero>
      <ComparateurPublicodes tabId={query.tabId} displayMode="grand public" />
    </SimplePage>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  return { props: { query: context.query } };
};

export default SimulateurPage;
