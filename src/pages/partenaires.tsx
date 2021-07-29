import PartnerCard from '@components/partenaires/partnerCard';
import Data from '@components/partenaires/partnerData.json';
import PartnerSection from '@components/partenaires/partnerSection';
import MainLayout from '@components/shared/layout/MainLayout';
import Head from 'next/head';
import React from 'react';

function Partner() {
  return (
    <>
      <Head>
        <title>Partenaires : France Chaleur Urbaine</title>
      </Head>
      <MainLayout>
        <div className="fr-container fr-my-2w">
          <div className="fr-grid-row">
            <h1>{Data.title}</h1>
          </div>
        </div>
        {Data.partners.map((partner, index) => (
          <PartnerSection key={index} title={partner.title}>
            {partner.items.map((item, index) => (
              <PartnerCard
                key={index}
                image={item.image}
                title={item.title}
                description={item.description}
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
