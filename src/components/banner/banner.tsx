import CheckEligibilityForm from '@components/checkEligibility/CheckEligibilityForm';
import React from 'react';
// banner rename
function Banner() {
  return (
    <div className="fr-container--fluid fr-mb-8w">
      <div className="fr-grid-row fr-grid-row--center">
        <div className="fr-col-lg-4 fr-col-md-8 fr-mr-11w">
          <img src="./pictoBuilding.png" alt="" />
        </div>
        <div className="fr-col-lg-7 fr-col-md-12">
          <CheckEligibilityForm />
        </div>
      </div>
    </div>
  );
}

export default Banner;
