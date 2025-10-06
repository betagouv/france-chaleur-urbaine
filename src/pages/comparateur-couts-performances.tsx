import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import dynamic from 'next/dynamic';
import type React from 'react';

import Placeholder, { Explanations, Logos, title } from '@/components/ComparateurPublicodes/Placeholder';
import SimplePage from '@/components/shared/page/SimplePage';
import Hero, { HeroContent, HeroTitle } from '@/components/ui/Hero';

const ComparateurPublicodes = dynamic(() => import('@/components/ComparateurPublicodes'), {
  loading: () => <Placeholder advancedMode={false} />,
  // Publicode engine takes 2s to load and is unnecessary on the server side
  ssr: false,
});

const SimulateurPage: React.FC<InferGetServerSidePropsType<typeof getServerSideProps>> = ({ query }) => {
  return (
    <SimplePage
      title="Comparateur de coûts et d’émissions de CO2"
      description="Comparez le coût et les émissions de CO2 des réseaux de chaleur, fioul, gaz et électricité pour votre adresse et vos caractéristiques"
    >
      <Hero variant="transparent" className="[&_article]:pb-0">
        <HeroTitle>{title}</HeroTitle>
        <HeroContent>
          <Logos size="sm" withFCU={false} />
          <Explanations advancedMode={false} />
        </HeroContent>
      </Hero>
      <ComparateurPublicodes tabId={query.tabId} advancedMode={false} />
    </SimplePage>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  return { props: { query: context.query } };
};

export default SimulateurPage;
