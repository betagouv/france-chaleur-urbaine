import AutocompleteAddress from '@components/autocompleteAddress/autocompleteAddress';
import React, { useState } from 'react';
import AlertEligibility from './AlertEligibility';

const CheckEligibilityForm = () => {
  const [displayEligibilityState, setDisplayEligibilityState] = useState(false);
  const [displayEligibility, setDisplayEligibility] = useState(false);
  const handleEligibilityChecked = (isEligible: boolean) => {
    setDisplayEligibilityState(true);
    setDisplayEligibility(isEligible);
  };
  return (
    <div className="fr-col-12 fr-col-md-8">
      <h1>Tester votre éligibilité</h1>
      {displayEligibilityState && (
        <AlertEligibility isEligible={displayEligibility} />
      )}
      <AutocompleteAddress onEligibilityChecked={handleEligibilityChecked} />
    </div>
  );
};

export default CheckEligibilityForm;
