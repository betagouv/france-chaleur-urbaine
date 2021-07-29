import {
  BannerContainer,
  Container,
  ImageContainer,
} from '@components/banner/banner.style';
import CheckEligibilityForm from '@components/checkEligibility/CheckEligibilityForm';
import React from 'react';

function Banner() {
  return (
    <BannerContainer className="fr-container--fluid fr-py-6w">
      <div className="fr-grid-row fr-grid-row--center">
        <div className="fr-col-lg-12">
          <div className="fr-container">
            <div className="fr-grid-row fr-grid-row--center">
              <ImageContainer className="fr-col-lg-4">
                <img src="./pictoBuilding.png" alt="pictogram" />
              </ImageContainer>
              <Container className="fr-col-lg-7 fr-col-md-12 fr-ml-1w fr-mt-2w">
                <CheckEligibilityForm />
              </Container>
            </div>
          </div>
        </div>
      </div>
    </BannerContainer>
  );
}

export default Banner;
