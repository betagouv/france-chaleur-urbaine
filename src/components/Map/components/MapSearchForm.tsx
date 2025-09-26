import { useQueryState } from 'nuqs';
import { useState } from 'react';

import AddressAutocomplete, { type AddressAutocompleteInputProps } from '@/components/form/dsfr/AddressAutocompleteInput';
import Link from '@/components/ui/Link';
import { useServices } from '@/services';
import { type HandleAddressSelect } from '@/types/HeatNetworksResponse';

const MapSearchForm = ({ onAddressSelect }: { onAddressSelect?: HandleAddressSelect }) => {
  const [eligibilityError, setEligibilityError] = useState(false);
  const { heatNetworkService } = useServices();
  const [defaultAddress, setDefaultAddress] = useQueryState('address');

  const handleAddressSelected: AddressAutocompleteInputProps['onSelect'] = async (geoAddress) => {
    if (!geoAddress) {
      return;
    }
    void setDefaultAddress(null);
    try {
      setEligibilityError(false);
      const network = await heatNetworkService.findByCoords(geoAddress);
      const addressDetail = {
        network,
        geoAddress,
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
      defaultValue={defaultAddress || ''}
      onClear={() => {
        setEligibilityError(false);
      }}
      nativeInputProps={{ placeholder: 'Ex: 5 Rue Censier 75005 Paris' }}
      onSelect={handleAddressSelected}
    />
  );
};
export default MapSearchForm;
