import { findPointFromAddressAndSuggestions } from '@components/addressAutocomplete/utils';
import { useCallback } from 'react';
import { Point, Suggestions } from '../../types';
type onAddressSelectedProps = (address: string, coordinates: Point) => void;

export const useFormAutocomplete = (
  onAddressSelected: onAddressSelectedProps
) => {
  const handleSelect = useCallback(
    (address: string, suggestions: Suggestions | []) => {
      const coords = findPointFromAddressAndSuggestions(address, suggestions);
      onAddressSelected(address, coords);
    },
    [onAddressSelected]
  );

  return {
    handleSelect,
  };
};
