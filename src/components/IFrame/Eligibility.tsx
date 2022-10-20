import AddressAutocomplete from '@components/addressAutocomplete';
import {
  CheckEligibilityFormLabel,
  SelectEnergy,
} from '@components/EligibilityForm/components';
import { energyInputsDefaultLabels } from '@components/EligibilityForm/EligibilityFormAddress';
import { Button } from '@dataesr/react-dsfr';
import { useState } from 'react';
import { SuggestionItem } from 'src/types/Suggestions';
import { Container } from './Eligibility.styles';

const Eligibility = () => {
  const [heatingType, setHeatingType] = useState('');
  const [address, setAddress] = useState<SuggestionItem>();
  return (
    <Container>
      <CheckEligibilityFormLabel>
        <SelectEnergy
          name="heatingType"
          selectOptions={energyInputsDefaultLabels}
          onChange={(e) => setHeatingType(e.target.value)}
          value={heatingType}
        />
      </CheckEligibilityFormLabel>
      <AddressAutocomplete
        placeholder="Tapez ici votre adresse"
        onAddressSelected={(address, suggestionItem) => {
          setAddress(suggestionItem);
          return Promise.resolve();
        }}
        popoverClassName={'popover-search-form'}
      />
      <Button
        disabled={!heatingType || !address}
        onClick={() =>
          window.open(
            //`https://france-chaleur-urbaine.beta.gouv.fr?heating=${heatingType}&address=${address?.properties.id}`
            //`http://localhost:3000?heating=${heatingType}&address=${address?.properties.label}`
            `https://france-chaleur-urbaine-pr361.osc-fr1.scalingo.io?heating=${heatingType}&address=${address?.properties.label}`
          )
        }
      >
        Tester mon adresse
      </Button>
    </Container>
  );
};

export default Eligibility;
