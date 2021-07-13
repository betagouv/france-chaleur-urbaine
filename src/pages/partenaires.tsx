import PartnerCard from '@components/partenaires/partnerCard';
import Data from '@components/partenaires/partnerData.json';
import PartnerSection from '@components/partenaires/partnerSection';
import MainLayout from '@components/shared/layout/MainLayout';
import React from 'react';

function Partner() {
  return (
    <MainLayout>
      <div className="fr-container fr-my-2w">
        <div className="fr-grid-row">
          <h2>{Data.title}</h2>
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
  );
}
export default Partner;
