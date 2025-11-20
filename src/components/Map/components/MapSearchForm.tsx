import { useQueryState } from 'nuqs';
import { useState } from 'react';

import AddressAutocomplete, { type AddressAutocompleteInputProps } from '@/components/form/dsfr/AddressAutocompleteInput';
import Link from '@/components/ui/Link';
import useUserInfo from '@/modules/app/client/hooks/useUserInfo';
import trpc from '@/modules/trpc/client';
import type { HandleAddressSelect } from '@/types/HeatNetworksResponse';

const MapSearchForm = ({
  onAddressSelect,
  withDefaultAddress,
}: {
  onAddressSelect?: HandleAddressSelect;
  withDefaultAddress?: boolean;
}) => {
  const [eligibilityError, setEligibilityError] = useState(false);
  const trpcUtils = trpc.useUtils();
  const [defaultAddress, setDefaultAddress] = useQueryState('address');
  const { userInfo, setUserInfo } = useUserInfo();

  const handleAddressSelected: AddressAutocompleteInputProps['onSelect'] = async (geoAddress) => {
    if (!geoAddress) {
      return;
    }
    void setDefaultAddress(null);
    try {
      setEligibilityError(false);
      const [lon, lat] = geoAddress.geometry.coordinates;
      const isCity = geoAddress.properties.label === geoAddress.properties.city;
      const network = isCity
        ? await trpcUtils.client.reseaux.cityNetwork.query({ city: geoAddress.properties.city })
        : await trpcUtils.client.reseaux.eligibilityStatus.query({
            city: geoAddress.properties.city,
            lat,
            lon,
          });
      const addressDetail = {
        geoAddress,
        network,
      };

      if (onAddressSelect) {
        onAddressSelect(geoAddress.properties.label, geoAddress.geometry.coordinates, addressDetail);
      }
    } catch (_err) {
      setEligibilityError(true);
    }
  };

  return (
    <AddressAutocomplete
      label={''}
      state={eligibilityError ? 'error' : undefined}
      stateRelatedMessage={
        eligibilityError ? (
          // get rid of parent flex
          <div>
            Une erreur est survenue. Veuillez réessayer ou bien <Link href="/contact">contacter le support</Link>.
          </div>
        ) : undefined
      }
      defaultValue={defaultAddress || (withDefaultAddress ? userInfo.address : undefined) || ''}
      onClear={() => {
        setEligibilityError(false);
        setUserInfo({ address: '' });
      }}
      nativeInputProps={{ placeholder: 'Ex: 5 Rue Censier 75005 Paris' }}
      onSelect={handleAddressSelected}
    />
  );
};
export default MapSearchForm;
