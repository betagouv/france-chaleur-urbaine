import { AddressAutocompleteLabel } from '@components/addressAutocomplete/AddressAutocompleteLabel';
import { useFormAutocomplete } from '@components/addressAutocomplete/useForm';
import useSuggestions from '@components/addressAutocomplete/useSuggestions';
import { Status, ValueOf } from '@components/addressAutocomplete/utils';
import { Combobox, ComboboxPopover } from '@reach/combobox';
import React from 'react';
import { Point } from 'src/types';
import { AddressInput } from './AddressInput';
import { EmptySuggestion } from './EmptySuggestion';
import { Suggestions } from './Suggestions';

type AddressProps = {
  onAddressSelected: (address: string, coordinates: Point) => void;
  label: string;
  placeholder: string;
  emptySuggestionText?: string;
  debounceTime?: number;
};
const _suggestionHasBeenAsked = (status: ValueOf<Status>): boolean =>
  status !== 'idle' && status !== 'loading';
const AddressAutocomplete: React.FC<AddressProps> = ({
  onAddressSelected,
  label,
  placeholder,
  emptySuggestionText,
  debounceTime = 200,
}) => {
  const { handleSelect } = useFormAutocomplete(onAddressSelected);
  const { suggestions, fetchSuggestions, status } = useSuggestions({
    debounceTime,
    limit: 5,
    autocomplete: false,
  });
  const displaySuggestions = _suggestionHasBeenAsked(status) && !!suggestions;
  return (
    <div className="fr-input-group">
      <AddressAutocompleteLabel label={label} />
      <Combobox
        aria-label="address"
        aria-labelledby="address"
        className="fr-input-wrap fr-fi-search-line"
        onSelect={(selectedAddress) =>
          handleSelect(selectedAddress, suggestions)
        }
      >
        <AddressInput
          onChangeCallback={(event) =>
            fetchSuggestions(event.currentTarget.value)
          }
          placeholder={placeholder}
        />
        {displaySuggestions && (
          <ComboboxPopover>
            {suggestions.length ? (
              <Suggestions suggestions={suggestions} />
            ) : (
              <EmptySuggestion text={emptySuggestionText} />
            )}
          </ComboboxPopover>
        )}
      </Combobox>
    </div>
  );
};

export default AddressAutocomplete;
