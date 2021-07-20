import {
  BannerContainer,
  Container,
  ImageContainer,
} from '@components/banner/banner.style';
import CheckEligibilityForm from '@components/checkEligibility/CheckEligibilityForm';
import Image from 'next/image';
import React from 'react';
function Banner() {
  return (
    <BannerContainer className="fr-container--fluid fr-py-6w">
      <div className="fr-grid-row fr-grid-row--center">
        <div className="fr-col-lg-12">
          <div className="fr-container">
            <div className="fr-grid-row fr-grid-row--center">
              <ImageContainer className="fr-col-lg-4">
                <Image
                  src="/pictograms/pictoBuilding.png"
                  alt="building illustration"
                  title="building illustration"
                  width="400px"
                  height="400px"
                />
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
