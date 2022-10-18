import { Combobox, ComboboxPopover } from '@reach/combobox';
import { useCallback, useMemo } from 'react';
import { SuggestionItem } from 'src/types/Suggestions';
import AddressAutocompleteGlobalStyle, {
  EmptySuggestion,
} from './AddressAutocomplete.style';
import {
  AddressAutocompleteLabel,
  AddressInput,
  Suggestions,
} from './components';
import useSuggestions from './useSuggestions';

const defaultLabel = '';
const defaultPlaceholder = 'Recherchez une adresse';
const defaultEmptySuggestionText = 'Aucune adresse trouvée :(';

type AddressProps = {
  centred?: boolean;
  label?: React.ReactNode;
  placeholder?: string;
  emptySuggestionText?: string;
  debounceTime?: number;
  minCharactersLength?: number;
  className?: string;
  popoverClassName?: string;
  onAddressSelected: (
    address: string,
    geoAddress: SuggestionItem
  ) => Promise<void>;
  onChange?: (e: string) => void;
};

const findAddressInSuggestions = (
  address: string,
  suggestions: SuggestionItem[]
): SuggestionItem | undefined => {
  return suggestions.find((item) => item.properties.label === address);
};

const AddressAutocomplete: React.FC<AddressProps> = ({
  label = defaultLabel,
  emptySuggestionText = defaultEmptySuggestionText,
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
    minCharactersLength,
  });
  const handleSelect = useCallback(
    (address: string, suggestions: SuggestionItem[]) => {
      const geoAddress = findAddressInSuggestions(address, suggestions);
      if (geoAddress) {
        onAddressSelected(address, geoAddress);
      }
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
    if (onChange) {
      onChange(value);
    }
    fetchSuggestions(value);
  };

  return (
    <>
      <AddressAutocompleteGlobalStyle />
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
                <EmptySuggestion>{emptySuggestionText}</EmptySuggestion>
              )}
            </ComboboxPopover>
          )}
        </Combobox>
      </div>
    </>
  );
};

export default AddressAutocomplete;
