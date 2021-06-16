import {
  Combobox,
  ComboboxInput,
  ComboboxList,
  ComboboxOption,
  ComboboxPopover,
} from '@reach/combobox';
import { useRouter } from 'next/dist/client/router';
import React, { useState } from 'react';
import styled from 'styled-components';
import useAutocompleteBan, {
  Coords,
  SuggestionItem,
  useHeatNetworks,
} from './useAutocompleteBan';

const Button = styled.button``;

type AddressProps = {
  onEligibilityChecked: () => void;
};
const Address: React.FC<AddressProps> = ({ onEligibilityChecked }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { push } = useRouter();
  const { suggestions } = useAutocompleteBan(searchTerm);
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
    onEligibilityChecked();
  };
  return (
    <>
      <form action="">
        <div className="fr-input-group">
          <label className="fr-label" htmlFor="text-input-groups1">
            Saisissez votre adresse en Ile-de-France et cliquez sur le bouton
            "Voir si je suis éligible".
            <span className="fr-hint-text">
              Exemple de format : 5 avenue Anatole 75007 Paris
            </span>
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
            {suggestions && (
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
          <Button
            className="fr-btn fr-btn--secondary"
            type="button"
            onClick={() => push('/resultat-eligibilite')}
          >
            Nous contacter
          </Button>
        ) : (
          <Button className="fr-btn fr-btn--secondary" type="button">
            VOIR SI JE SUIS ELIGIBLE
          </Button>
        )}
      </form>
    </>
  );
};

export default Address;
