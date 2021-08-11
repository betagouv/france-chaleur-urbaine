import { useCallback, useState } from 'react';
import { Point, Suggestions } from '../../types';
type onAddressSelectedProps = (address: string, coordinates: Point) => void;

export const useFormAutocomplete = (
  onAddressSelected: onAddressSelectedProps
) => {
  const [address, setAddress] = useState('');
  //const { suggestions, displaySuggestions } = useBan(address);

  const getCoordinates = useCallback(
    (address: string, suggestions: Suggestions | []): Point => {
      const suggestion = suggestions.find(
        (item) => item.properties.label === address
      );
      return suggestion?.geometry.coordinates || [0, 0];
    },
    []
  );

  const handleSelect = useCallback(
    (address: string, suggestions: Suggestions | []) => {
      const coords = getCoordinates(address, suggestions);
      onAddressSelected(address, coords);
    },
    [getCoordinates, onAddressSelected]
  );

  return {
    handleSelect,
    address,
    updateAddress: setAddress,
  };
};
