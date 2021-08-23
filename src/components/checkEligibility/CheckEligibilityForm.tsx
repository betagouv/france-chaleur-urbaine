import AddressAutocomplete from '@components/addressAutocomplete/AddressAutocomplete';
import { convertPointToCoordinates } from '@components/addressAutocomplete/utils';
import { PageTitle } from '@components/checkEligibility/checkElegibility.style';
import { useLocalStorageState } from '@utils/useLocalStorage';
import { useRouter } from 'next/router';
import React, { useEffect } from 'react';
import { Point } from 'src/types';
import { useHeatNetworks } from './useHeatNetworks';

const CheckEligibilityForm = () => {
  const { status, checkEligibility, isEligible } = useHeatNetworks();

  const { push } = useRouter();
  const [, saveInStorage] = useLocalStorageState('');

  const handleAddressSelected = async (
    address: string,
    point: Point
  ): Promise<void> => {
    const coords = convertPointToCoordinates(point);
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
  return (
    <>
      <PageTitle className="fr-mb-4w">
        Votre copropriété peut-elle être raccordée à un réseau de chaleur ?{' '}
        <br />
        <span>Un chauffage économique et écologique</span>
      </PageTitle>

      <AddressAutocomplete
        onAddressSelected={handleAddressSelected}
        placeholder={'Exemple: 5 avenue Anatole 75007 Paris'}
        label="Renseignez ci-dessous l'adresse de votre logement"
      />
    </>
  );
};

export default CheckEligibilityForm;
