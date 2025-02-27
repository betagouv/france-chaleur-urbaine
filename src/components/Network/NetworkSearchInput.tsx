import { fr } from '@codegouvfr/react-dsfr';
import { useMemo, useRef, useState } from 'react';
import styled from 'styled-components';

import { clientConfig } from '@/client-config';
import Box from '@/components/ui/Box';
import { Combobox, ComboboxInput, ComboboxList, ComboboxOption, ComboboxPopover } from '@/components/ui/Combobox';
import { type NetworkSearchResult } from '@/pages/api/networks/search';
import debounce from '@/utils/debounce';
import { postFetchJSON } from '@/utils/network';
import { getUuid } from '@/utils/random';

interface NetworkSearchInputProps {
  label: string | JSX.Element;
  value: string;
  onNetworkSelect: (network: NetworkSearchResult | null) => void;
  onChange: (searchTerm: string) => void;
  selectedNetwork: NetworkSearchResult | null;
  className?: string;
}

function NetworkSearchInput(props: NetworkSearchInputProps) {
  const [results, setResults] = useState<NetworkSearchResult[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const inputId = useRef(getUuid());

  const debouncedSearchNetworks: (search: string) => void = useMemo(() => {
    return debounce(async (search: string) => {
      const networks = await postFetchJSON<NetworkSearchResult[]>('/api/networks/search', {
        search,
      });
      setIsFetching(false);
      setResults(networks);
    }, 300);
  }, []);

  function onInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const newSearchTerm = event.target.value;
    props.onChange(newSearchTerm);

    if (newSearchTerm.length >= clientConfig.networkSearchMinimumCharactersThreshold) {
      setIsFetching(true);
      debouncedSearchNetworks(newSearchTerm);
    } else {
      setResults([]);
    }
  }

  return (
    <Box className={`fr-input-group ${props.className ?? ''}`}>
      <label className="fr-label" htmlFor={inputId.current}>
        {props.label}
      </label>

      {props.selectedNetwork ? (
        <button
          className={fr.cx('fr-tag', 'fr-tag--sm', 'fr-tag--dismiss', 'fr-mt-2w')}
          title="Supprimer la sélection du réseau"
          onClick={() => {
            props.onNetworkSelect(null);
            props.onChange('');
          }}
        >
          {props.selectedNetwork['Identifiant reseau']} - {props.selectedNetwork.nom_reseau}
        </button>
      ) : (
        <Combobox
          className={fr.cx('fr-input-wrap', 'ri-search-line')}
          onSelect={(selectedNetworkOption) => {
            const selectedNetworkIdFCU = selectedNetworkOption.split(' - ')[0];
            const selectedNetwork = results.find((network) => network['Identifiant reseau'] === selectedNetworkIdFCU);
            props.onChange(selectedNetworkOption);
            if (selectedNetwork) {
              props.onNetworkSelect(selectedNetwork);
              setResults([selectedNetwork]);
            }
          }}
        >
          <ComboboxInput
            className="fr-input"
            required
            placeholder="recherche par identifiant ou nom de réseau"
            id={inputId.current}
            value={props.value}
            onChange={onInputChange}
            autoComplete="off"
          />

          {(results.length > 0 || (props.value.length >= clientConfig.networkSearchMinimumCharactersThreshold && !isFetching)) && (
            <ComboboxPopover>
              <ComboboxList>
                {results.map((network) => (
                  <StyledComboxOption key={network.id_fcu} value={`${network['Identifiant reseau']} - ${network.nom_reseau}`} />
                ))}
                {results.length === 0 && <Box>Aucun réseau trouvé</Box>}
              </ComboboxList>
            </ComboboxPopover>
          )}
        </Combobox>
      )}
    </Box>
  );
}

// change the default highlight from displaying non-matching part (= suggested values) in bold
// to displaying the matching part (= user values) in bold and blue
const StyledComboxOption = styled(ComboboxOption)`
  // defaults to bold
  [data-suggested-value] {
    font-weight: inherit;
  }

  [data-user-value] {
    color: var(--blue-france-113);
    font-weight: bold;
  }
`;

export default NetworkSearchInput;
