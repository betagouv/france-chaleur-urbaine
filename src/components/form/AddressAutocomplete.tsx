import type React from 'react';

import { searchBANAddresses } from '@/modules/ban/client';
import type { SuggestionItem } from '@/modules/ban/types';

import Autocomplete from './Autocomplete';

export type AddressAutocompleteProps = Omit<
  React.ComponentProps<typeof Autocomplete>,
  'children' | 'getOptionValue' | 'fetchFn' | 'onSelect'
> & {
  onSelect: (option: SuggestionItem) => void;
  onlyCities?: boolean;
  excludeCities?: boolean;
  limit?: number | string;
};

const AddressAutocomplete = ({
  nativeInputProps,
  onSelect,
  onClear,
  onlyCities,
  excludeCities,
  limit = 10,
  ...props
}: AddressAutocompleteProps) => {
  const fetchOptions = async (query: string) => searchBANAddresses({ excludeCities, limit, onlyCities, query });

  return (
    <Autocomplete
      minCharThreshold={3} // API BAN
      fetchFn={fetchOptions}
      onSelect={(address) => {
        onSelect(address);
      }}
      getOptionValue={(option) => (onlyCities ? `${option.properties.city}, ${option.properties.postcode}` : option.properties.label)}
      onClear={() => {
        onClear?.();
      }}
      nativeInputProps={{
        ...nativeInputProps,
        placeholder: nativeInputProps?.placeholder || 'Tapez ici votre adresse',
      }}
      {...props}
    />
  );
};

export default AddressAutocomplete;
