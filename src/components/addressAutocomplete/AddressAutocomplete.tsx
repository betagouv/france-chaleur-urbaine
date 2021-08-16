import { useFormAutocomplete } from '@components/addressAutocomplete/useForm';
import useSuggestions from '@components/addressAutocomplete/useSuggestions';
import { Combobox, ComboboxPopover } from '@reach/combobox';
import React from 'react';
import { Point } from 'src/types';
import { AddressInput } from './AddressInput';
import { EmptySuggestion } from './EmptySuggestion';
import { Suggestions } from './Suggestions';

type AddressProps = {
  onAddressSelected: (address: string, coordinates: Point) => void;
};
const AddressAutocomplete: React.FC<AddressProps> = ({ onAddressSelected }) => {
  const { handleSelect, updateAddress, address } =
    useFormAutocomplete(onAddressSelected);
  const { suggestions, displaySuggestions } = useSuggestions(address);
  return (
    <div className="fr-input-group">
      <label className="fr-label" htmlFor="address">
        <span className="fr-hint-text fr-text--sm">
          Renseignez ci-dessous l'adresse de votre logement
        </span>
      </label>
      <Combobox
        aria-label="address"
        aria-labelledby="address"
        className="fr-input-wrap fr-fi-search-line"
        onSelect={(selectedAddress) =>
          handleSelect(selectedAddress, suggestions)
        }
      >
        <AddressInput
          onChange={(event) => {
            updateAddress(event.currentTarget.value);
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
