import { AddressAutocompleteLabel } from '@components/addressAutocomplete/AddressAutocompleteLabel';
import { Suggestions } from '@components/addressAutocomplete/Suggestions';
import { useFormAutocomplete } from '@components/addressAutocomplete/useForm';
import { Status, ValueOf } from '@components/addressAutocomplete/utils';
import { Combobox, ComboboxPopover } from '@reach/combobox';
import React from 'react';
import { Point, Suggestions as SuggestionsType } from 'src/types';
import { createGlobalStyle } from 'styled-components';
import { AddressInput } from './AddressInput';
import { EmptySuggestion } from './EmptySuggestion';

const defaultLabel = '';
const defaultPlaceholder = 'Recherchez une adresse';

const GlobalStyle = createGlobalStyle`
  .fr-input {
    transition: box-shadow .5s ease;
    color: #000074;

    :focus {
      box-shadow: inset 0 -2px 0 0 #000074;
    }
  }

  .fr-input-wrap {
    box-shadow: 0 0 5px rgb(0 0 0 / 74%);
    border-radius: .25rem .25rem 0 0;
  }
`;

export type TypeHandleAddressSelected = (
  address: string,
  coordinates: Point
) => void;

type AddressProps = {
  centred?: boolean;
  onAddressSelected: TypeHandleAddressSelected;
  label?: React.ReactNode;
  placeholder?: string;
  emptySuggestionText?: string;
  debounceTime?: number;
  minCharactersLength?: number;
  className?: string;
  popoverClassName?: string;
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
  className,
  popoverClassName,
  centred,
  onAddressSelected,
}) => {
  const { handleSelect, suggestions, fetchSuggestions, status } =
    useFormAutocomplete(onAddressSelected, debounceTime);
  const shouldDisplaySuggestions = _suggestionHasBeenAsked(status);
  return (
    <>
      <GlobalStyle />
      <div className={`fr-input-group ${className || ''}`}>
        {label && (
          <AddressAutocompleteLabel centred={centred}>
            {label}
          </AddressAutocompleteLabel>
        )}
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
            <ComboboxPopover className={popoverClassName}>
              {hasSuggestions(suggestions) ? (
                <Suggestions suggestions={suggestions} />
              ) : (
                <EmptySuggestion text={emptySuggestionText} />
              )}
            </ComboboxPopover>
          )}
        </Combobox>
      </div>
    </>
  );
};

export default AddressAutocomplete;
