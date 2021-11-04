import React from 'react';
import { BannerContainer } from './Slice.style';

const Slice: React.FC<{ pattern?: string }> = ({ children, pattern }) => {
  return (
    <BannerContainer className="fr-container--fluid fr-py-2w" pattern={pattern}>
      <div className="fr-grid-row fr-grid-row--center">
        <div className="fr-col-lg-12">
          <div className="fr-container">{children}</div>
        </div>
      </div>
    </BannerContainer>
  );
};

export default Slice;
