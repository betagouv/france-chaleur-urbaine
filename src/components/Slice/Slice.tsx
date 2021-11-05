import React from 'react';
import { SliceContainer, SliceSection } from './Slice.style';

const Slice: React.FC<{ theme?: string }> = ({ children, theme }) => {
  return (
    <SliceSection className="fr-container--fluid fr-py-2w" theme={theme}>
      <div className="fr-grid-row fr-grid-row--center">
        <SliceContainer className="fr-col-lg-12">
          <div className="fr-container">{children}</div>
        </SliceContainer>
      </div>
    </SliceSection>
  );
};

export default Slice;
