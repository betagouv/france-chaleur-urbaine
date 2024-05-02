import { energyInputsDefaultLabels } from '@components/EligibilityForm/EligibilityFormAddress';
import {
  CheckEligibilityFormLabel,
  SelectEnergy,
} from '@components/EligibilityForm/components';
import AddressAutocomplete from '@components/addressAutocomplete';
import { Button } from '@codegouvfr/react-dsfr/Button';
import { useState } from 'react';
import { SuggestionItem } from 'src/types/Suggestions';
import { Container, Form, Header } from './Eligibility.styles';
import Image from 'next/image';
import { AnalyticsFormId } from 'src/services/analytics';

const Eligibility = () => {
  const [heatingType, setHeatingType] = useState('');
  const [address, setAddress] = useState<SuggestionItem>();
  return (
    <Container>
      <Header>
        <b>Votre immeuble pourrait-il être raccordé à un réseau de chaleur ?</b>
        <Image
          height={136}
          width={242}
          src="/logo-fcu-with-typo.jpg"
          alt="logo france chaleur urbaine"
        />
      </Header>
      <Form id={AnalyticsFormId.form_test_adresse}>
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
              `https://france-chaleur-urbaine.beta.gouv.fr?heating=${heatingType}&address=${address?.properties.label}`
            )
          }
        >
          Tester mon adresse
        </Button>
      </Form>
    </Container>
  );
};

export default Eligibility;
