import CheckEligibilityForm from '@components/checkEligibility/CheckEligibilityForm';
import React from 'react';
import {
  BannerContainer,
  Container,
  ImageContainer,
  PageTitle,
  PageTitlePreTitle,
  PageTitleTeaser,
} from './banner.style';

function Banner() {
  return (
    <BannerContainer>
      <div className="fr-grid-row fr-grid-row--center">
        <ImageContainer className="fr-col-lg-5">
          <img
            src="./illu-reseau-de-chaleur.png"
            alt="Reseau de chaleur urbaine"
          />
        </ImageContainer>
        <Container className="fr-col-lg-7 fr-mt-2w">
          <CheckEligibilityForm formLabel="Votre copropriété est-elle raccordable&nbsp;?">
            <PageTitle className="fr-mb-4w">
              <PageTitlePreTitle>
                Vous êtes chauffé au fioul ou au gaz&nbsp;?
              </PageTitlePreTitle>
              Changez pour un chauffage écologique à prix stable&nbsp;!
            </PageTitle>
            <PageTitleTeaser>
              France Chaleur Urbaine{' '}
              <strong>
                vous accompagne concrètement pour vous raccorder à un réseau de
                chaleur
              </strong>
            </PageTitleTeaser>
          </CheckEligibilityForm>
        </Container>
      </div>
    </BannerContainer>
  );
}

export default Banner;
