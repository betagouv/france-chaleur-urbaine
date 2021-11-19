import MarkdownWrapper from '@components/MarkdownWrapper';
import PartnerCard from '@components/partenaires/partnerCard';
import Data from '@components/partenaires/partnerData.json';
import PartnerSection from '@components/partenaires/partnerSection';
import MainLayout from '@components/shared/layout/MainLayout';
import Head from 'next/head';
import React from 'react';
import styled from 'styled-components';

const StyledMarkdown = styled(MarkdownWrapper)`
  p {
    font-size: 1.25rem;
    line-height: 2rem;
  }
`;

function Partner() {
  return (
    <>
      <Head>
        <title>Partenaires : France Chaleur Urbaine</title>
      </Head>
      <MainLayout currentMenu="partenaires">
        <div className="fr-container fr-my-2w">
          <div className="fr-grid-row">
            <h1>{Data.title}</h1>
          </div>
          {Data.teaser && (
            <div className="fr-col-12">
              <StyledMarkdown value={Data.teaser} />
            </div>
          )}
        </div>
        {Data.partners.map(({ title, teaser, items }, index) => (
          <PartnerSection key={index} title={title} teaser={teaser}>
            {items.map((item, index) => (
              <PartnerCard
                key={index}
                image={item.image}
                title={item.title}
                link={item.link}
              />
            ))}
          </PartnerSection>
        ))}
      </MainLayout>
    </>
  );
}
export default Partner;
