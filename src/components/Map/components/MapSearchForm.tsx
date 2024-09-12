import { useState } from 'react';

import AddressAutocomplete, { type AddressAutocompleteInputProps } from '@components/form/dsfr/AddressAutocompleteInput';
import Link from '@components/ui/Link';
import { useServices } from 'src/services';
import { HandleAddressSelect } from 'src/types/HeatNetworksResponse';

const MapSearchForm = ({ onAddressSelect }: { onAddressSelect?: HandleAddressSelect }) => {
  const [eligibilityError, setEligibilityError] = useState(false);
  const { heatNetworkService } = useServices();

  const handleAddressSelected: AddressAutocompleteInputProps['onSelect'] = async (geoAddress) => {
    if (!geoAddress) {
      return;
    }
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
    } catch (err) {
      setEligibilityError(true);
    }
  };

  return (
    <AddressAutocomplete
      label=""
      state={eligibilityError ? 'error' : undefined}
      stateRelatedMessage={
        eligibilityError ? (
          <>
            Une erreur est survenue. Veuillez réessayer ou bien <Link href="/contact">contacter le support</Link>.
          </>
        ) : undefined
      }
      defaultValue={''}
      onClear={() => {
        setEligibilityError(false);
      }}
      onSelect={handleAddressSelected}
    />
  );
};
export default MapSearchForm;
