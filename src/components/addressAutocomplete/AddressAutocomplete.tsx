import { Combobox, ComboboxPopover } from '@reach/combobox';
import React, { useState } from 'react';
import { Point } from 'src/types';
import { AddressInput } from './AddressInput';
import { EmptySuggestion } from './EmptySuggestion';
import { Suggestions } from './Suggestions';
import useBan from './useBan';

type AddressProps = {
  onAddressSelected: (address: string, coordinates: Point) => void;
};
const AddressAutocomplete: React.FC<AddressProps> = ({ onAddressSelected }) => {
  const [address, setAddress] = useState('');
  const { suggestions, displaySuggestions } = useBan(address);
  const getCoordinates = (address: string) => {
    const suggestion = suggestions.find(
      (item) => item.properties.label === address
    );
    return suggestion?.geometry.coordinates || [0, 0];
  };
  const handleSelect = (address: string) => {
    onAddressSelected(address, getCoordinates(address));
  };
  return (
    <div className="fr-input-group">
      <label className="fr-label" htmlFor="address">
        <span className="fr-hint-text">Adresse à tester</span>
      </label>
      <Combobox
        aria-label="address"
        aria-labelledby="address"
        className="fr-input-wrap fr-fi-search-line"
        onSelect={handleSelect}
      >
        <AddressInput
          onChange={(event) => {
            setAddress(event.currentTarget.value);
          }}
        />
        {displaySuggestions && (
          <ComboboxPopover>
            {suggestions.length ? (
              <Suggestions suggestions={suggestions} />
            ) : (
              <EmptySuggestion />
            )}
          </ComboboxPopover>
        )}
      </Combobox>
    </div>
  );
};

export default AddressAutocomplete;
