import PartnerCard from '@components/partenaires/partnerCard';
import React from 'react';

type ResourceSection = {
  title: string;
  children: JSX.Element | JSX.Element[] | any;
};

function PartnerSection({ title, children }: ResourceSection) {
  return (
    <div className="fr-container fr-my-8w">
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12">
          <h3>{title}</h3>
        </div>
        {children?.map((child: PartnerCard, index: number) => (
          <div key={index} className="fr-col-lg-3 fr-col-sm-6">
            {child}
          </div>
        ))}
      </div>
    </div>
  );
}

export default PartnerSection;
