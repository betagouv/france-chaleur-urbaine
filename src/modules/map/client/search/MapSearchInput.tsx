import { fr } from '@codegouvfr/react-dsfr';
import { useCallback, useState } from 'react';

import { trackPostHogEvent } from '@/modules/analytics/client';
import { BAN_MIN_QUERY_LENGTH, searchBANAddresses } from '@/modules/ban/client';
import type { BANAddressFeature } from '@/modules/ban/types';
import { highlightMatch } from '@/modules/form/AddressSearch';
import { Autocomplete } from '@/modules/form/Autocomplete';
import type { NetworkMapSearchResult } from '@/modules/reseaux/server/service';
import trpc from '@/modules/trpc/client';
import cx from '@/utils/cx';

export type MapSearchAddressResult = {
  kind: 'address';
  label: string;
  coordinates: [number, number];
  isCity: boolean;
  feature: BANAddressFeature;
};

export type MapSearchNetworkResult = NetworkMapSearchResult & { kind: 'network' };

export type MapSearchResult = MapSearchAddressResult | MapSearchNetworkResult;

type Option = { type: 'network'; data: NetworkMapSearchResult } | { type: 'address'; data: BANAddressFeature };

type MapSearchInputProps = {
  onSelect: (result: MapSearchResult) => void;
  /** Called when the user clears the input via the inline X button. */
  onClear?: () => void;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
};

/**
 * Combined address + network search input. Fans out to BAN + `reseaux.searchForMap`
 * tRPC query in parallel; emits a discriminated `MapSearchResult` to the caller.
 */
export function MapSearchInput({ onSelect, onClear, defaultValue, placeholder, className }: MapSearchInputProps) {
  const trpcUtils = trpc.useUtils();
  const [error, setError] = useState(false);
  const [value, setValue] = useState(defaultValue ?? '');

  const fetchFn = useCallback(
    async (query: string, signal: AbortSignal): Promise<Option[]> => {
      try {
        setError(false);
        const [addresses, networks] = await Promise.all([
          searchBANAddresses({ query, signal }),
          trpcUtils.client.reseaux.searchForMap.query({ search: query }, { signal }),
        ]);
        return [
          ...networks.map((network): Option => ({ data: network, type: 'network' })),
          ...addresses.map((address): Option => ({ data: address, type: 'address' })),
        ];
      } catch (err) {
        if ((err as { name?: string })?.name === 'AbortError') {
          throw err;
        }
        setError(true);
        return [];
      }
    },
    [trpcUtils]
  );

  const getOptionValue = useCallback((option: Option) => {
    if (option.type === 'network') {
      return option.data.nom_reseau ?? option.data.identifiant_reseau ?? `Réseau #${option.data.id_fcu}`;
    }
    return option.data.properties.label;
  }, []);

  const getOptionLabel = useCallback((option: Option, query: string) => {
    if (option.type === 'network') {
      const { nom_reseau, identifiant_reseau, gestionnaire, network_type } = option.data;
      const primary = nom_reseau ?? identifiant_reseau ?? `Réseau #${option.data.id_fcu}`;
      const secondary = [identifiant_reseau && identifiant_reseau !== primary ? identifiant_reseau : null, gestionnaire]
        .filter(Boolean)
        .join(' · ');
      const iconClass =
        network_type === 'reseau_de_froid'
          ? 'ri-snowflake-line text-sky-500'
          : network_type === 'reseau_en_construction'
            ? 'fr-icon-fire-fill text-pink-400'
            : 'fr-icon-fire-fill text-green-600';
      return (
        <div className="flex items-start gap-2">
          <i className={cx('fr-icon--sm shrink-0', iconClass)} aria-hidden />
          <div className="min-w-0 flex-1">
            <div className="truncate">{highlightMatch(primary, query)}</div>
            {secondary && <div className="truncate text-xs text-(--text-mention-grey)">{secondary}</div>}
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2">
        <i className="fr-icon-map-pin-2-line fr-icon--sm shrink-0 text-(--text-mention-grey)" aria-hidden />
        <span className="truncate">{highlightMatch(option.data.properties.label, query)}</span>
      </div>
    );
  }, []);

  const handleSelect = (option: Option) => {
    trackPostHogEvent('map:address_searched');
    if (option.type === 'network') {
      onSelect({ ...option.data, kind: 'network' });
      // Network results aren't materialized as a marker — clear so the user can
      // start a new search without reusing the previous label.
      Promise.resolve().then(() => setValue(''));
      return;
    }
    const feature = option.data;
    const [lng, lat] = feature.geometry.coordinates;
    onSelect({
      coordinates: [lng, lat],
      feature,
      isCity: feature.properties.label === feature.properties.city,
      kind: 'address',
      label: feature.properties.label,
    });
    // Keep the address label visible so the user can see the active selection
    // and clear it via the inline X (which removes the associated marker).
  };

  return (
    <div className={className}>
      <Autocomplete<Option>
        fetchFn={fetchFn}
        minCharThreshold={BAN_MIN_QUERY_LENGTH}
        getOptionValue={getOptionValue}
        getOptionLabel={getOptionLabel}
        value={value}
        onChange={setValue}
        onClear={onClear}
        nativeInputProps={{
          className: fr.cx('fr-input'),
          placeholder: placeholder ?? 'Adresse, ville, réseau...',
        }}
        onSelect={handleSelect}
      />
      {error && <p className="mt-1 text-xs text-(--text-default-error)">Erreur lors de la recherche. Réessayez ou contactez le support.</p>}
    </div>
  );
}
