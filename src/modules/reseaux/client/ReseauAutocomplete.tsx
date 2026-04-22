import { useCallback } from 'react';

import { highlightMatch } from '@/modules/form/AddressSearch';
import { Autocomplete } from '@/modules/form/Autocomplete';
import type { NetworkType } from '@/modules/reseaux/constants';
import type { NetworkSearchResult } from '@/modules/reseaux/server/service';
import trpc from '@/modules/trpc/client';
import cx from '@/utils/cx';

type ReseauAutocompleteProps = {
  onSelect: (network: NetworkSearchResult) => void;
  excludeNetworkIdFcu?: number | null;
  excludeNetworkType?: NetworkType | null;
  placeholder?: string;
  id?: string;
  className?: string;
};

/**
 * Autocomplete mono-select des réseaux (existants + en construction) basé sur
 * `trpc.reseaux.searchNetworks`. Désactive visuellement l'option correspondant
 * au réseau en cours d'affectation si `excludeNetworkIdFcu` + `excludeNetworkType` sont fournis.
 */
export default function ReseauAutocomplete({
  onSelect,
  excludeNetworkIdFcu,
  excludeNetworkType,
  placeholder = 'nom ou identifiant SNCU',
  id,
  className,
}: ReseauAutocompleteProps) {
  const utils = trpc.useUtils();

  const fetchFn = useCallback(
    async (query: string) => {
      return utils.reseaux.searchNetworks.fetch({ search: query });
    },
    [utils]
  );

  const getOptionValue = useCallback((network: NetworkSearchResult) => {
    const base = network.nom_reseau ?? 'Sans nom';
    return network.identifiant_reseau ? `${network.identifiant_reseau} - ${base}` : base;
  }, []);

  const getOptionLabel = useCallback(
    (network: NetworkSearchResult, query: string) => {
      const isExcluded = network.id_fcu === excludeNetworkIdFcu && network.network_type === excludeNetworkType;
      const typeLabel = network.network_type === 'en_construction' ? 'En construction' : 'Existant';
      return (
        <div className={cx('flex flex-col', isExcluded && 'opacity-50')}>
          <span className="font-medium">{highlightMatch(network.nom_reseau ?? 'Sans nom', query)}</span>
          <span className="text-xs text-gray-500">
            {network.identifiant_reseau && <>{highlightMatch(network.identifiant_reseau, query)} · </>}
            {typeLabel}
            {isExcluded && ' · réseau actuel'}
          </span>
        </div>
      );
    },
    [excludeNetworkIdFcu, excludeNetworkType]
  );

  const handleSelect = useCallback(
    (network: NetworkSearchResult) => {
      if (network.id_fcu === excludeNetworkIdFcu && network.network_type === excludeNetworkType) return;
      onSelect(network);
    },
    [excludeNetworkIdFcu, excludeNetworkType, onSelect]
  );

  return (
    <Autocomplete
      id={id}
      className={className}
      fetchFn={fetchFn}
      getOptionValue={getOptionValue}
      getOptionLabel={getOptionLabel}
      onSelect={handleSelect}
      minCharThreshold={2}
      nativeInputProps={{
        className: 'fr-input',
        placeholder,
      }}
    />
  );
}
