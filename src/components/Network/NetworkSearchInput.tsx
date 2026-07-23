import { fr } from '@codegouvfr/react-dsfr';
import { useCallback, useId } from 'react';

import { clientConfig } from '@/client-config';
import { highlightMatch } from '@/modules/form/AddressSearch';
import { Autocomplete } from '@/modules/form/Autocomplete';
import type { NetworkSearchResult } from '@/pages/api/networks/search';
import { fetchJSON } from '@/utils/network';

type NetworkSearchInputProps = {
  label: string | JSX.Element;
  value?: string;
  onNetworkSelect: (network: NetworkSearchResult | null) => void;
  onChange?: (searchTerm: string) => void;
  selectedNetwork: NetworkSearchResult | null;
  className?: string;
  // DSFR error props, injected by the form layer's CustomField
  state?: 'error' | 'default';
  stateRelatedMessage?: string;
};

function NetworkSearchInput({
  label,
  value,
  onNetworkSelect,
  onChange,
  selectedNetwork,
  className,
  state,
  stateRelatedMessage,
}: NetworkSearchInputProps) {
  const id = useId();

  const fetchFn = useCallback(async (query: string, signal: AbortSignal) => {
    return fetchJSON<NetworkSearchResult[]>('/api/networks/search', {
      body: JSON.stringify({ search: query }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
      signal,
    });
  }, []);

  const getOptionValue = useCallback((network: NetworkSearchResult) => `${network['Identifiant reseau']} - ${network.nom_reseau}`, []);

  const getOptionLabel = useCallback(
    (network: NetworkSearchResult, query: string) => highlightMatch(getOptionValue(network), query),
    [getOptionValue]
  );

  const hasError = state === 'error';

  return (
    <div className={`fr-input-group ${hasError ? 'fr-input-group--error' : ''} ${className ?? ''}`}>
      <label className="fr-label" htmlFor={id}>
        {label}
      </label>

      {selectedNetwork ? (
        <button
          className={fr.cx('fr-tag', 'fr-tag--sm', 'fr-tag--dismiss', 'fr-mt-2w')}
          title="Supprimer la sélection du réseau"
          onClick={() => {
            onNetworkSelect(null);
            onChange?.('');
          }}
        >
          {selectedNetwork['Identifiant reseau']} - {selectedNetwork.nom_reseau}
        </button>
      ) : (
        <Autocomplete
          id={id}
          fetchFn={fetchFn}
          getOptionValue={getOptionValue}
          getOptionLabel={getOptionLabel}
          value={value}
          onChange={onChange}
          onSelect={onNetworkSelect}
          onClear={() => {
            onNetworkSelect(null);
            onChange?.('');
          }}
          minCharThreshold={clientConfig.networkSearchMinimumCharactersThreshold}
          nativeInputProps={{
            className: `fr-input ${hasError ? 'fr-input--error' : ''}`,
            placeholder: 'recherche par identifiant ou nom de réseau',
            required: true,
          }}
        />
      )}
      {hasError && stateRelatedMessage && <p className="fr-error-text">{stateRelatedMessage}</p>}
    </div>
  );
}

export default NetworkSearchInput;
