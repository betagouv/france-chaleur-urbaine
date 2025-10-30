import type React from 'react';
import { clientConfig } from '@/client-config';
import type { SuggestionItem, SuggestionResponse } from '@/types/Suggestions';
import { fetchJSON } from '@/utils/network';
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
  const fetchOptions = async (query: string) => {
    const suggestions = await fetchJSON<SuggestionResponse>(clientConfig.banApiBaseUrl, {
      params: {
        limit: limit.toString(),
        q: query,
        ...(onlyCities ? { type: 'municipality' } : {}),
      },
    });

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
