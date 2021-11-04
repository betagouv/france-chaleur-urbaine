import { AddressAutocompleteLabel } from '@components/addressAutocomplete/AddressAutocompleteLabel';
import { Suggestions } from '@components/addressAutocomplete/Suggestions';
import { useFormAutocomplete } from '@components/addressAutocomplete/useForm';
import { Status, ValueOf } from '@components/addressAutocomplete/utils';
import { Combobox, ComboboxPopover } from '@reach/combobox';
import React from 'react';
import { Point, Suggestions as SuggestionsType } from 'src/types';
import { AddressInput } from './AddressInput';
import { EmptySuggestion } from './EmptySuggestion';

const defaultLabel = 'Testez votre éligibilité';
const defaultPlaceholder = 'Entrez une adresse';

type AddressProps = {
  centred?: boolean;
  onAddressSelected: (address: string, coordinates: Point) => void;
  label?: string;
  placeholder?: string;
  emptySuggestionText?: string;
  debounceTime?: number;
  minCharactersLength?: number;
};
const _suggestionHasBeenAsked = (status: ValueOf<Status>): boolean =>
  status !== 'idle' && status !== 'loading';
const hasSuggestions = (suggestions: SuggestionsType | []): boolean =>
  !!suggestions.length;

const AddressAutocomplete: React.FC<AddressProps> = ({
  label = defaultLabel,
  emptySuggestionText,
  debounceTime = 200,
  minCharactersLength = 3,
  placeholder = defaultPlaceholder,
  centred,
  onAddressSelected,
}) => {
  const { handleSelect, suggestions, fetchSuggestions, status } =
    useFormAutocomplete(onAddressSelected, debounceTime);
  const shouldDisplaySuggestions = _suggestionHasBeenAsked(status);
  return (
    <div className="fr-input-group">
      <AddressAutocompleteLabel label={label} centred={centred} />
      <Combobox
        aria-label="address"
        aria-labelledby="address"
        className="fr-input-wrap fr-fi-search-line"
        onSelect={(selectedAddress) =>
          handleSelect(selectedAddress, suggestions)
        }
      >
        <AddressInput
          onChange={(event) =>
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
