import AddressAutocomplete from '@components/addressAutocomplete/AddressAutocomplete';
import { convertPointToCoordinates } from '@components/addressAutocomplete/utils';
import markupData, {
  facebookEvent,
  googleAdsEvent,
  linkedInEvent,
  matomoEvent,
} from '@components/Markup';
import { useLocalStorageState } from '@utils/useLocalStorage';
import { useRouter } from 'next/router';
import React, { useEffect } from 'react';
import { Coords, Point } from 'src/types';
import { useHeatNetworks } from './useHeatNetworks';

type CheckEligibilityFormProps = {
  formLabel?: React.ReactNode;
  centredForm?: boolean;
};

const CheckEligibilityForm: React.FC<CheckEligibilityFormProps> = ({
  formLabel,
  centredForm,
  children,
}) => {
  const { status, checkEligibility, isEligible } = useHeatNetworks();
  const { push } = useRouter();
  const [storage, saveInStorage] = useLocalStorageState('');

  const callMarkupEvent = (isEligible: boolean, address?: string) => {
    if (isEligible) {
      matomoEvent(markupData.eligibilityTestOK.matomoEvent, [
        address || 'Adresse indefini',
      ]);
      linkedInEvent(markupData.eligibilityTestOK.linkedInEvent);
      googleAdsEvent(
        '10794036298',
        markupData.eligibilityTestOK.googleAdsEvent
      );
    } else {
      matomoEvent(markupData.eligibilityTestKO.matomoEvent, [
        address || 'Adresse indefini',
      ]);
      linkedInEvent(markupData.eligibilityTestKO.linkedInEvent);
      googleAdsEvent(
        '10794036298',
        markupData.eligibilityTestKO.googleAdsEvent
      );
    }
  };
  const handleAddressSelected = async (
    address: string,
    point: Point
  ): Promise<void> => {
    matomoEvent(markupData.eligibilityTest.matomoEvent, [address]);
    linkedInEvent(markupData.eligibilityTest.linkedInEvent);
    facebookEvent(markupData.eligibilityTest.facebookEvent);
    googleAdsEvent('10794036298', markupData.eligibilityTest.googleAdsEvent);

    const coords: Coords = convertPointToCoordinates(point);
    await checkEligibility(coords, callMarkupEvent, address);
    saveInStorage({ coords: [coords.lat, coords.lon], label: address });
  };

  useEffect(() => {
    if (status === 'success') {
      push({
        pathname: '/demande-de-contact',
        query: { isEligible },
      });
    }
  }, [isEligible, push, status, storage?.label]);

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
