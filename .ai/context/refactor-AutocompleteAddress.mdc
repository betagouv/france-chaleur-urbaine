Un nouveau AddressAutocoomplete a été créé
Voila les changements à faire


- import AddressAutocomplete from '@/components/addressAutocomplete'; est remplacé par import AddressAutocomplete, { type AddressAutocompleteInputProps } from '@/components/form/dsfr/AddressAutocompleteInput';
- <AddressAutocomplete placeholder="Tapez ici votre adresse" onAddressSelected={handleAddressSelected} /> est remplacé par <AddressAutocomplete nativeInputProps={{ placeholder: 'Tapez ici votre adresse' }} onSelect={handleAddressSelected} />
- la fonction 
```
const handleAddressSelected = useCallback(
    async (address: string, geoAddress?: SuggestionItem): Promise<void> => {
```
est remplacée par 
````
const handleAddressSelected: AddressAutocompleteInputProps['onSelect'] = useCallback(
    async (geoAddress?: SuggestionItem): Promise<void> => {
      const address = geoAddress?.properties?.label;
```

