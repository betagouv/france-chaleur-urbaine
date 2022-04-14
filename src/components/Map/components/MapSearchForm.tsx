import AddressAutocomplete from '@components/addressAutocomplete/AddressAutocomplete';
import React from 'react';
import { useServices } from 'src/services';
import { Point } from 'src/types';
import { MapSearchFormGlobalStyle } from './MapSearchForm.style';

export type TypeHandleAddressSelect = (
  address: string,
  coordinates: Point,
  addressDetails: any
) => void;

const MapSearchForm = ({
  onAddressSelect,
}: {
  onAddressSelect: TypeHandleAddressSelect;
}) => {
  const { heatNetworkService } = useServices();

  const handleAddressSelected = async (
    address: string,
    point: Point
  ): Promise<void> => {
    const [lng, lat] = point;

    const coords = { lat, lon: lng };
    const network = await heatNetworkService.findByCoords(coords);
    const addressDetail = {
      networkDetails: network,
    };

    if (onAddressSelect) {
      onAddressSelect(address, [lat, lng], addressDetail);
    }
  };

  return (
    <>
      <MapSearchFormGlobalStyle />
      <AddressAutocomplete
        placeholder="Rechercher une adresse"
        onAddressSelected={handleAddressSelected}
        className="map-search-form"
        popoverClassName={'popover-map-search-form'}
      />
    </>
  );
};
export default MapSearchForm;
