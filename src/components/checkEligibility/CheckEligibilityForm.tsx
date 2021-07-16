import AddressAutocomplete from '@components/addressAutocomplete/AddressAutocomplete';
import { PageTitle } from '@components/checkEligibility/checkElegibility.style';
import { useLocalStorageState } from '@utils/useLocalStorage';
import { useRouter } from 'next/router';
import React, { useEffect } from 'react';
import { Coords, Point } from 'src/types';
import AlertEligibility from './AlertEligibility';
import { useHeatNetworks } from './useHeatNetworks';

const CheckEligibilityForm = () => {
  const { status, checkEligibility, isEligible } = useHeatNetworks();
  const showAlert = status === 'success';
  const { push } = useRouter();
  const [, saveInStorage] = useLocalStorageState('');

  const handleAddressSelected = async (
    address: string,
    coordinates: Point
  ): Promise<void> => {
    const coords = getCoords(coordinates);
    await checkEligibility(coords);
    saveInStorage({ coords: [coords.lat, coords.lon], label: address });
  };
  useEffect(() => {
    if (status === 'success') {
      push({
        pathname: '/demande-de-contact',
        query: { isEligible },
      });
    }
  }, [isEligible, push, status]);

  const getCoords = (point: number[]): Coords => ({
    lon: point[0],
    lat: point[1],
  });
  return (
    <>
      <PageTitle className="fr-mb-4w">
        Votre copropriété peut-elle être raccordée à un réseau de chaleur ?{' '}
        <br />
        <span>Un chauffage économique et écologique</span>
      </PageTitle>
      {showAlert && <AlertEligibility isEligible={isEligible} />}
      <AddressAutocomplete onAddressSelected={handleAddressSelected} />
    </>
  );
};

export default CheckEligibilityForm;
