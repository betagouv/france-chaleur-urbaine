import { Button } from '@codegouvfr/react-dsfr/Button';
import { parseAsString, useQueryState } from 'nuqs';
import { useState } from 'react';

import { clientConfig } from '@/client-config';
import { CheckEligibilityFormLabel, SelectEnergy } from '@/components/EligibilityForm/components';
import { energyInputsDefaultLabels } from '@/components/EligibilityForm/EligibilityFormAddress';
import Image from '@/components/ui/Image';
import { AnalyticsFormId } from '@/modules/analytics/client';
import type { BANAddressFeature } from '@/modules/ban/types';
import { getTrackingContext } from '@/modules/conversion-tracking/client/trackingContext';
import { useTrackPageView } from '@/modules/conversion-tracking/client/useTrackPageView';
import { AddressField } from '@/modules/form/AddressField';

import { Container, Form, Header } from './Eligibility.styles';

const Eligibility = () => {
  const [heatingType, setHeatingType] = useState('');
  const [address, setAddress] = useState<BANAddressFeature>();
  // Cette iframe **redirige vers le site** : on propage `source` et `host` dans l'URL pour que le
  // test/demande réalisé ensuite sur la page d'atterrissage reste attribué à l'intégration et au site
  // partenaire (aucune persistance).
  const [source] = useQueryState('source', parseAsString);
  useTrackPageView();

  const openOnSite = () => {
    const params = new URLSearchParams({ address: address?.properties.label ?? '', heating: heatingType });
    if (source) {
      params.set('source', source);
    }
    const { host } = getTrackingContext();
    if (host) {
      params.set('host', host);
    }
    window.open(`${clientConfig.websiteUrl}?${params}`);
  };

  return (
    <Container>
      <Header>
        <b>Votre immeuble pourrait-il être raccordé à un réseau de chaleur ?</b>
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
        <AddressField label="" nativeInputProps={{ placeholder: 'Tapez ici votre adresse' }} onSelect={(item) => setAddress(item)} />
        <Button disabled={!heatingType || !address} onClick={openOnSite}>
          Tester mon adresse
        </Button>
      </Form>
    </Container>
  );
};

export default Eligibility;
