import { useState } from 'react';

import useContactFormFCU from '@/hooks/useContactFormFCU';
import type { AvailableHeating } from '@/modules/app/types';
import type { BANAddressFeature } from '@/modules/ban/types';
import trpc from '@/modules/trpc/client';

/**
 * Heat network eligibility test of a selected BAN address, same flow as the legacy
 * `HeadSliceForm`: fetches the network data, then hands over to `useContactFormFCU`
 * which opens the contact form with the result.
 */
export function useEligibilityTest() {
  const contactForm = useContactFormFCU();
  const trpcUtils = trpc.useUtils();
  const [hasError, setHasError] = useState(false);

  const testEligibility = async (geoAddress: BANAddressFeature, heatingType: NonNullable<AvailableHeating>) => {
    setHasError(false);
    const address = geoAddress.properties.label;
    contactForm.handleOnFetchAddress({ address });
    const [lon, lat] = geoAddress.geometry.coordinates;

    try {
      const isCity = geoAddress.properties.label === geoAddress.properties.city;
      const eligibility = isCity
        ? await trpcUtils.client.reseaux.cityNetwork.query({ city: geoAddress.properties.city })
        : await trpcUtils.client.reseaux.eligibilityStatus.query({ lat, lon });
      contactForm.handleOnSuccessAddress({ address, coords: { lat, lon }, eligibility, geoAddress, heatingType });
    } catch (_error) {
      setHasError(true);
    }
    contactForm.setLoadingStatus('idle');
  };

  return {
    addressData: contactForm.addressData,
    contactReady: contactForm.contactReady,
    handleOnSubmitContact: contactForm.handleOnSubmitContact,
    handleResetFormContact: contactForm.handleResetFormContact,
    hasError,
    isLoading: contactForm.loadingStatus === 'loading',
    messageReceived: contactForm.messageReceived,
    testEligibility,
  };
}
