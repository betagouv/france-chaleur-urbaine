import CheckEligibilityForm from '@components/checkEligibility/CheckEligibilityForm';
import React from 'react';
import {
  BannerContainer,
  Container,
  PageTitle,
  PageTitlePreTitle,
} from './banner.style';

function Banner() {
  return (
    <BannerContainer>
      <div className="fr-grid-row fr-grid-row--center">
        <Container className="fr-col-lg-7 fr-mb-2w">
          <CheckEligibilityForm formLabel="Votre copropriété est-elle raccordable&nbsp;?">
            <PageTitle className="fr-mb-4w">
              <PageTitlePreTitle>
                France Chaleur Urbaine est un service public gratuit.
              </PageTitlePreTitle>
              Découvrez les réseaux de chaleur : un chauffage écologique à prix
              stable&nbsp;!
            </PageTitle>
          </CheckEligibilityForm>
        </Container>
      </div>
    </BannerContainer>
  );
}

export default Banner;
