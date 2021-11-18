import AddressAutocomplete from '@components/addressAutocomplete/AddressAutocomplete';
import { convertPointToCoordinates } from '@components/addressAutocomplete/utils';
import markupData, { googleAdsEvent, linkedInEvent } from '@components/Markup';
import { useLocalStorageState } from '@utils/useLocalStorage';
import { useRouter } from 'next/router';
import React, { useEffect } from 'react';
import { Coords, Point } from 'src/types';
import { useHeatNetworks } from './useHeatNetworks';

type CheckEligibilityFormProps = {
  formLabel?: string;
  centredForm?: boolean;
};

const CheckEligibilityForm: React.FC<CheckEligibilityFormProps> = ({
  formLabel,
  centredForm,
  children,
}) => {
  const { status, checkEligibility, isEligible } = useHeatNetworks();
  const { push } = useRouter();
  const [, saveInStorage] = useLocalStorageState('');

  const handleAddressSelected = async (
    address: string,
    point: Point
  ): Promise<void> => {
    linkedInEvent(markupData.eligibilityTest.linkedInEvent);
    googleAdsEvent('10794036298', markupData.eligibilityTest.googleAdsEvent);

    const coords: Coords = convertPointToCoordinates(point);
    await checkEligibility(coords);
    saveInStorage({ coords: [coords.lat, coords.lon], label: address });
  };

  useEffect(() => {
    if (status === 'success') {
      if (isEligible) {
        linkedInEvent(markupData.eligibilityTestOK.linkedInEvent);
        googleAdsEvent(
          '10794036298',
          markupData.eligibilityTestOK.googleAdsEvent
        );
      } else {
        linkedInEvent(markupData.eligibilityTestKO.linkedInEvent);
        googleAdsEvent(
          '10794036298',
          markupData.eligibilityTestKO.googleAdsEvent
        );
      }
      push({
        pathname: '/demande-de-contact',
        query: { isEligible },
      });
    }
  }, [isEligible, push, status]);

  return (
    <>
      {children}
      <AddressAutocomplete
        label={formLabel}
        placeholder="Tapez ici votre adresse"
        centred={centredForm}
        onAddressSelected={handleAddressSelected}
      />
    </>
  );
};

export default CheckEligibilityForm;
