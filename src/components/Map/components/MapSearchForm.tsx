import AddressAutocomplete from '@components/addressAutocomplete';
import { useContactFormFCU } from '@hooks';
import React from 'react';
import { AddressFcu, Point, SuggestionItem } from 'src/types';
import { MapSearchFormGlobalStyle } from './MapSearchForm.style';

export type TypeHandleAddressSelect = (arg: AddressFcu) => void;

const MapSearchForm = ({
  onAddressSelect,
}: {
  onAddressSelect: TypeHandleAddressSelect;
}) => {
  const { convertAddressBanToFcu } = useContactFormFCU();

  const handleAddressSelected = async (
    address: string,
    point: Point,
    geoAddress?: SuggestionItem
  ): Promise<void> => {
    const fcuAddress = (await convertAddressBanToFcu({
      address,
      points: point,
      geoAddress,
    })) as AddressFcu;

    if (onAddressSelect) onAddressSelect(fcuAddress);
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
