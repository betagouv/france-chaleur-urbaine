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
    <BannerContainer className="fr-container--fluid fr-py-6w">
      <div className="fr-grid-row fr-grid-row--center">
        <div className="fr-col-lg-12">
          <div className="fr-container">
            <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--center">
              <ImageContainer className="fr-col-lg-5">
                <img
                  src="./illu-reseau-de-chaleur.png"
                  alt="Reseau de chaleur urbaine"
                />
              </ImageContainer>
              <Container className="fr-col-lg-6 fr-col-md-12 fr-ml-1w fr-mt-2w">
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
                      vous accompagne concrètement pour vous raccorder à un
                      réseau de chaleur
                    </strong>
                  </PageTitleTeaser>
                </CheckEligibilityForm>
              </Container>
            </div>
          </div>
        </div>
      </div>
    </BannerContainer>
  );
}

export default Banner;
