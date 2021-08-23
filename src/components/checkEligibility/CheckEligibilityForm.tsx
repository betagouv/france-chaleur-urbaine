import AddressAutocomplete from '@components/addressAutocomplete/AddressAutocomplete';
import { convertPointToCoordinates } from '@components/addressAutocomplete/utils';
import { PageTitle } from '@components/checkEligibility/checkElegibility.style';
import { useLocalStorageState } from '@utils/useLocalStorage';
import { useRouter } from 'next/router';
import React, { useEffect } from 'react';
import { Point } from 'src/types';
import { useHeatNetworks } from './useHeatNetworks';

const CheckEligibilityForm = () => {
  const { status, checkEligibility, isEligible } = useHeatNetworks();

  const { push } = useRouter();
  const [, saveInStorage] = useLocalStorageState('');

  const handleAddressSelected = async (
    address: string,
    point: Point
  ): Promise<void> => {
    const coords = convertPointToCoordinates(point);
    await checkEligibility(coords);
    saveInStorage({ coords: [coords.lat, coords.lon], label: address });
  };
  useEffect(() => {
    if (status === 'success') {
      push({
        pathname: '/demande-de-contact',
        query: { isEligible },
      });
    }
  }, [isEligible, push, status]);
  return (
    <>
      <PageTitle className="fr-mb-4w">
        Votre copropriété peut-elle être raccordée à un réseau de chaleur ?{' '}
        <br />
        <span>Un chauffage économique et écologique</span>
      </PageTitle>

      <AddressAutocomplete
        onAddressSelected={handleAddressSelected}
        placeholder={'Exemple: 5 avenue Anatole 75007 Paris'}
        label="Renseignez ci-dessous l'adresse de votre logement"
      />
    </>
  );
};

export default CheckEligibilityForm;
/*
<AddressAutocomplete

  placeholder=""
  onCreateItem={handleCreateItem}
  items={suggestions}
  selectedItems={selectedItems}
  onSelectedItemsChange={(changes) =>
    handleSelectedItemsChange(changes.selectedItems)
  }
/>*/
/*
<PlacesAutocomplete
  value={address || ''}
  ****
  onChange={handleAddressChanged}
  onSelect={handleAddressSelected}
  shouldFetchSuggestions={address?.length > 3}
  onError={handleError}
  debounce={200}****
  googleCallbackName="initPlaceComponent"
  searchOptions={{
    componentRestrictions: {
      country: 'fr',
    },
    types: ['address'],
  }}
  highlightFirstSuggestion={true}
>
  {({ getInputProps, suggestions, getSuggestionItemProps }) => (
    <>
      <Field
        label={''}
        id={COMPONENT_NAME}
        name={COMPONENT_NAME}
        component={FormItem}
        error={error}
        isValid={isValidAddress}
        errorMessage={ErrorMessage}
        options={getInputProps({
          onBlur: onBlur,
          type: 'search',
        })}
      />
      <Suggestions
        suggestions={suggestions}
        suggestionItemProps={getSuggestionItemProps}
      />
      {displayEmptySuggestions && (
        <SuggestionNotFoundInfo>
          <button
            onClick={onAddCustomAddress}
            type={'button'}
            data-testid="add-custom-address"
          >
            {t(
              `partners:${partnerCode}.address.step.fields.address.errors.not_found`,
              'address:step.fields.address.errors.not_found'
            )}
          </button>
        </SuggestionNotFoundInfo>
      )}
    </>
  )}
</PlacesAutocomplete>
</>*/
