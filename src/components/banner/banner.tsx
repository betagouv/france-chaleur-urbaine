import {
  BannerContainer,
  ImageContainer,
} from '@components/banner/banner.style';
import CheckEligibilityForm from '@components/checkEligibility/CheckEligibilityForm';
import React from 'react';

function Banner() {
  return (
    <BannerContainer className="fr-container--fluid fr-py-11w">
      <div className="fr-grid-row fr-grid-row--center">
        <div className="fr-col-lg-8">
          <div className="fr-container--fluid">
            <div className="fr-grid-row fr-grid-row--center">
              <ImageContainer className="fr-col-lg-4">
                <img src="./pictoBuilding.png" alt="" />
              </ImageContainer>
              <div className="fr-col-lg-7 fr-col-md-12 fr-ml-6w fr-mt-2w">
                <CheckEligibilityForm />
              </div>
            </div>
          </div>
        </div>
      </div>
    </BannerContainer>
  );
}

export default Banner;
