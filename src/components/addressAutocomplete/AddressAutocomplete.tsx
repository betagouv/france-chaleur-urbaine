import { Combobox, ComboboxPopover } from '@reach/combobox';
import React, { useCallback, useMemo } from 'react';
import {
  Point,
  SuggestionItem,
  Suggestions as SuggestionsType,
} from 'src/types';
import { createGlobalStyle } from 'styled-components';
import {
  AddressAutocompleteLabel,
  AddressInput,
  EmptySuggestion,
  Suggestions,
} from './components';
import useSuggestions from './useSuggestions';

const defaultLabel = '';
const defaultPlaceholder = 'Recherchez une adresse';

type TypeHandleAddressSelected = (
  address: string,
  coordinates: Point,
  geoAddress?: SuggestionItem
) => void;

type AddressProps = {
  centred?: boolean;
  label?: React.ReactNode;
  placeholder?: string;
  emptySuggestionText?: string;
  debounceTime?: number;
  minCharactersLength?: number;
  className?: string;
  popoverClassName?: string;
  onAddressSelected: TypeHandleAddressSelected;
  onChange?: (e: string) => void;
};

const findAddressInSuggestions = (
  address: string,
  suggestions: SuggestionsType | []
): SuggestionItem | undefined => {
  const suggestion = suggestions.find(
    (item) => item.properties.label === address
  );
  return suggestion;
};

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
  onChange,
}) => {
  const { suggestions, fetchSuggestions, status } = useSuggestions({
    debounceTime,
    limit: 5,
    autocomplete: false,
    minCharactersLength,
  });
  const handleSelect = useCallback(
    (address: string, suggestions: SuggestionsType | []) => {
      const geoAddress = findAddressInSuggestions(address, suggestions);
      const coords = geoAddress?.geometry.coordinates || [0, 0];
      onAddressSelected(address, coords, geoAddress);
    },
    [onAddressSelected]
  );
  const shouldDisplaySuggestions = useMemo(
    () => status !== 'idle' && status !== 'loading',
    [status]
  );
  const hasSuggestions = useMemo(() => !!suggestions.length, [suggestions]);

  const onChangeHandler = (event: React.FormEvent<HTMLInputElement>) => {
    const value = event.currentTarget.value;
    if (onChange) onChange(value);
    fetchSuggestions(value);
  };

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
          <AddressInput onChange={onChangeHandler} placeholder={placeholder} />
          {shouldDisplaySuggestions && (
            <ComboboxPopover className={popoverClassName}>
              {hasSuggestions ? (
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
