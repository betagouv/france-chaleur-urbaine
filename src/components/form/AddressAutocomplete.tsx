import React from 'react';

import { useServices } from 'src/services';

import Autocomplete from './Autocomplete';

export type AddressAutocompleteProps = Omit<React.ComponentProps<typeof Autocomplete>, 'children' | 'getOptionValue' | 'fetchFn'>;

const AddressAutocomplete = ({ nativeInputProps, onSelect, onClear, ...props }: AddressAutocompleteProps) => {
  // const [address, setAddress] = React.useState<Awaited<ReturnType<typeof fetchOptions>>[number]>();
  const { suggestionService } = useServices();
  const fetchOptions = async (query: string) => {
    const suggestions = await suggestionService.fetchSuggestions(query, { limit: '10' });

    return suggestions.features;
  };

  return (
    <Autocomplete
      minCharThreshold={3} // API BAN
      fetchFn={fetchOptions}
      onSelect={(address) => {
        // setAddress(address);
        onSelect(address);
      }}
      getOptionValue={(option) => option.properties.label}
      onClear={() => {
        // setAddress(undefined);
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
