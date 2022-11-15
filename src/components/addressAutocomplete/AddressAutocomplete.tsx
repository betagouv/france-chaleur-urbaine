import { Combobox, ComboboxPopover } from '@reach/combobox';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
    geoAddress?: SuggestionItem
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
  const router = useRouter();
  const [address, setAddress] = useState('');
  const [seeSuggestions, setSeeSuggestions] = useState(true);

  const { suggestions, fetchSuggestions, status } = useSuggestions({
    debounceTime,
    limit: 5,
    minCharactersLength,
  });

  const handleSelect = useCallback(
    (address: string, suggestions: SuggestionItem[]) => {
      const geoAddress = findAddressInSuggestions(address, suggestions);
      setAddress(address);
      if (geoAddress) {
        setSeeSuggestions(false);
        onAddressSelected(address, geoAddress);
      }
    },
    [onAddressSelected]
  );

  useEffect(() => {
    const { address } = router.query;

    if (address) {
      setAddress(address as string);
      setSeeSuggestions(false);
      fetchSuggestions(address as string);
    }
  }, [router.query, fetchSuggestions]);

  useEffect(() => {
    const { address } = router.query;
    if (address && suggestions.length > 0) {
      handleSelect(address as string, suggestions);
      router.replace(router.pathname);
    }
  }, [router.query, suggestions, handleSelect, router]);

  const shouldDisplaySuggestions = useMemo(
    () => seeSuggestions && status !== 'idle' && status !== 'loading',
    [status, seeSuggestions]
  );
  const hasSuggestions = useMemo(() => !!suggestions.length, [suggestions]);

  const onChangeHandler = (event: React.FormEvent<HTMLInputElement>) => {
    const value = event.currentTarget.value;
    setAddress(value);
    setSeeSuggestions(true);
    onAddressSelected(value);
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
          <AddressInput
            onChange={onChangeHandler}
            placeholder={placeholder}
            value={address}
          />
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
