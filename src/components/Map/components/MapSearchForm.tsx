import { useState } from 'react';

import AddressAutocomplete from '@components/addressAutocomplete';
import Box from '@components/ui/Box';
import Link from '@components/ui/Link';
import { useServices } from 'src/services';
import { HandleAddressSelect } from 'src/types/HeatNetworksResponse';
import { SuggestionItem } from 'src/types/Suggestions';

import { MapSearchFormGlobalStyle } from './MapSearchForm.style';

const MapSearchForm = ({ onAddressSelect }: { onAddressSelect?: HandleAddressSelect }) => {
  const [eligibilityError, setEligibilityError] = useState(false);
  const { heatNetworkService } = useServices();

  const handleAddressSelected = async (address: string, geoAddress?: SuggestionItem): Promise<void> => {
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
        onAddressSelect(address, geoAddress.geometry.coordinates, addressDetail);
      }
    } catch (err) {
      setEligibilityError(true);
    }
  };

  return (
    <>
      <MapSearchFormGlobalStyle />
      <AddressAutocomplete placeholder="Rechercher une adresse" onAddressSelected={handleAddressSelected} className="map-search-form" />
      {eligibilityError && (
        <Box textColor="#c00" mt="1w">
          Une erreur est survenue. Veuillez réessayer ou bien <Link href="/contact">contacter le support</Link>.
        </Box>
      )}
    </>
  );
};
export default MapSearchForm;
