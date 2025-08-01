import { Button } from '@codegouvfr/react-dsfr/Button';
import { useState } from 'react';

import { clientConfig } from '@/client-config';
import AddressAutocomplete from '@/components/addressAutocomplete';
import { CheckEligibilityFormLabel, SelectEnergy } from '@/components/EligibilityForm/components';
import { energyInputsDefaultLabels } from '@/components/EligibilityForm/EligibilityFormAddress';
import Image from '@/components/ui/Image';
import { AnalyticsFormId } from '@/services/analytics';
import { type SuggestionItem } from '@/types/Suggestions';

import { Container, Form, Header } from './Eligibility.styles';

const Eligibility = () => {
  const [heatingType, setHeatingType] = useState('');
  const [address, setAddress] = useState<SuggestionItem>();
  return (
    <Container>
      <Header>
        <b>Votre immeuble pourrait-il être raccordé à un réseau de chaleur ?</b>
        <Image height={136} width={242} src="/logo-fcu-with-typo.jpg" alt="logo france chaleur urbaine" />
      </Header>
      <Form id={AnalyticsFormId.form_test_adresse}>
        <CheckEligibilityFormLabel>
          <SelectEnergy
            className="fr-mb-2w"
            name="heatingType"
            selectOptions={energyInputsDefaultLabels}
            onChange={setHeatingType}
            value={heatingType}
          />
        </CheckEligibilityFormLabel>
        <AddressAutocomplete
          placeholder="Tapez ici votre adresse"
          onAddressSelected={(address, suggestionItem) => {
            setAddress(suggestionItem);
          }}
        />
        <Button
          disabled={!heatingType || !address}
          onClick={() => window.open(`${clientConfig.websiteOrigin}?heating=${heatingType}&address=${address?.properties.label}`)}
        >
          Tester mon adresse
        </Button>
      </Form>
    </Container>
  );
};

export default Eligibility;
