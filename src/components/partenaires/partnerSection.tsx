import React from 'react';
import PartnerCard from './partnerCard';

type ResourceSection = {
  title: string;
  children: JSX.Element | JSX.Element[] | any;
  teaser?: string;
};

function PartnerSection({ title, teaser, children }: ResourceSection) {
  return (
    <div className="fr-container fr-my-8w">
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12">
          <h2>{title}</h2>
        </div>
        {teaser && (
          <div className="fr-col-12">
            <p className="fr-text--lg">{teaser}</p>
          </div>
        )}
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
