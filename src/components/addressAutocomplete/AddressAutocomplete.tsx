import { AddressAutocompleteLabel } from '@components/addressAutocomplete/AddressAutocompleteLabel';
import { Suggestions } from '@components/addressAutocomplete/Suggestions';
import { useFormAutocomplete } from '@components/addressAutocomplete/useForm';
import { Status, ValueOf } from '@components/addressAutocomplete/utils';
import { Combobox, ComboboxPopover } from '@reach/combobox';
import React from 'react';
import { Point, Suggestions as SuggestionsType } from 'src/types';
import { AddressInput } from './AddressInput';
import { EmptySuggestion } from './EmptySuggestion';

type AddressProps = {
  onAddressSelected: (address: string, coordinates: Point) => void;
  label: string;
  placeholder: string;
  emptySuggestionText?: string;
  debounceTime?: number;
  minCharactersLength?: number;
};
const _suggestionHasBeenAsked = (status: ValueOf<Status>): boolean =>
  status !== 'idle' && status !== 'loading';
const hasSuggestions = (suggestions: SuggestionsType | []): boolean =>
  !!suggestions.length;

const AddressAutocomplete: React.FC<AddressProps> = ({
  onAddressSelected,
  label,
  placeholder,
  emptySuggestionText,
  debounceTime = 200,
  minCharactersLength = 3,
}) => {
  const { handleSelect, suggestions, fetchSuggestions, status } =
    useFormAutocomplete(onAddressSelected, debounceTime);
  const shouldDisplaySuggestions = _suggestionHasBeenAsked(status);
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
            fetchSuggestions(event.currentTarget.value, minCharactersLength)
          }
          placeholder={placeholder}
        />
        {shouldDisplaySuggestions && (
          <ComboboxPopover>
            {hasSuggestions(suggestions) ? (
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
