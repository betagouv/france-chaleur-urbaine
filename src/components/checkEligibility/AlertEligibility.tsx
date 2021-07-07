import Alert from '@components/shared/alert/Alert';
import React from 'react';

type AlertEligibilityProps = { isEligible: boolean };
const AlertEligibility: React.FC<AlertEligibilityProps> = ({ isEligible }) => {
  return (
    <Alert>
      Cette adresse {isEligible ? 'est' : "n'est pas"} éligible à un réseau de
      chaleur urbaine
    </Alert>
  );
};

export default AlertEligibility;
