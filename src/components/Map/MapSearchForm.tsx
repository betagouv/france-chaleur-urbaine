import AddressAutocomplete from '@components/addressAutocomplete/AddressAutocomplete';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet/dist/leaflet.css';
import React from 'react';
import { useMap } from 'react-leaflet';
import { useServices } from 'src/services';
import { Point } from 'src/types';
import { createGlobalStyle } from 'styled-components';

const MapSearchFormGlobalStyle = createGlobalStyle`
  .popover-class-name {
    z-index: 1000;
  }
`;

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
  const map = useMap();

  const { heatNetworkService } = useServices();

  const handleAddressSelected = async (
    address: string,
    point: Point
  ): Promise<void> => {
    const [lng, lat] = point;
    const newLatLng = { lat, lng };

    map.setView(newLatLng, map.getMaxZoom() - 1, {
      animate: true,
    });

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
        popoverClassName={'popover-class-name'}
      />
    </>
  );
};
export default MapSearchForm;
