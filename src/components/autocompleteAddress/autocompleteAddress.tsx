import { useHeatNetworks } from '@components/checkEligibility/useHeatNetworks';
import {
  Combobox,
  ComboboxInput,
  ComboboxList,
  ComboboxOption,
  ComboboxPopover,
} from '@reach/combobox';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { Coords, SuggestionItem } from 'src/types';
import useBan from './useBan';

type AddressProps = {
  onEligibilityChecked: (isEligible: boolean) => void;
};
const AutocompleteAddress: React.FC<AddressProps> = ({
  onEligibilityChecked,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { push } = useRouter();
  const { suggestions, displaySuggestions } = useBan(searchTerm);
  const { checkEligibility, isEligible } = useHeatNetworks();

  const getCoords = (point: number[]): Coords => {
    return {
      lon: point[0],
      lat: point[1],
    };
  };

  const handleAddressSelected = async (
    suggestion: Omit<SuggestionItem, 'type'>
  ) => {
    await checkEligibility(getCoords(suggestion.geometry.coordinates));
    onEligibilityChecked(isEligible);
  };
  return (
    <>
      <div className="fr-input-group">
        <p>
          Votre copropriété peut-elle être raccordée à un réseau de chauffage
          urbain en France ?Découvrez s’il existe un réseau de chaleur proche de
          votre copropriété.
        </p>
        <label className="fr-label" htmlFor="text-input-groups1">
          <span className="fr-hint-text">Adresse à tester</span>
        </label>
        <Combobox
          aria-label="adresse"
          className="fr-input-wrap fr-fi-search-line"
        >
          <ComboboxInput
            className="fr-input"
            type="text"
            id="text-input-groups1"
            name="text-input-groups1"
            placeholder="5 avenue Anatole 75007 Paris"
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          {displaySuggestions && (
            <ComboboxPopover>
              {suggestions.length ? (
                <ComboboxList>
                  {suggestions.map(
                    ({ properties, geometry }: SuggestionItem) => (
                      <ComboboxOption
                        key={properties.id}
                        value={properties.label}
                        onClick={() =>
                          handleAddressSelected({ properties, geometry })
                        }
                      />
                    )
                  )}
                </ComboboxList>
              ) : (
                <p
                  style={{
                    margin: 0,
                    color: '#454545',
                    padding: '0.25rem 1rem 0.75rem 1rem',
                    fontStyle: 'italic',
                  }}
                >
                  Aucune adresse trouvée :(
                </p>
              )}
            </ComboboxPopover>
          )}
        </Combobox>
      </div>
      {isEligible ? (
        <button
          className="fr-btn fr-btn--secondary"
          type="button"
          onClick={() => push('/resultat-eligibilite')}
        >
          Nous contacter
        </button>
      ) : (
        <button className="fr-btn fr-btn--secondary" type="button">
          VOIR SI JE SUIS ELIGIBLE
        </button>
      )}
    </>
  );
};

export default AutocompleteAddress;
