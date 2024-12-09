import React from 'react';

import { useServices } from '@/services';
import { SuggestionItem } from '@/types/Suggestions';

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
  const { suggestionService } = useServices();
  const fetchOptions = async (query: string) => {
    const params: Parameters<typeof suggestionService.fetchSuggestions>[1] = { limit: limit.toString() };
    if (onlyCities) {
      params.type = 'municipality';
    }
    const suggestions = await suggestionService.fetchSuggestions(query, params);

    const features = excludeCities
      ? suggestions.features.filter((feature) => feature.properties.type !== 'municipality')
      : suggestions.features;

    return features;
  };

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
