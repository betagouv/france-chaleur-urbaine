import { useState } from 'react';

import { trackPostHogEvent } from '@/modules/analytics/client';
import type { BANAddressFeature } from '@/modules/ban/types';
import { AddressField, type AddressFieldProps } from '@/modules/form/AddressField';

export type AddressSelection = {
  /** BAN-provided label (full formatted address or "City, postcode"). */
  label: string;
  /** [lng, lat] tuple. */
  coordinates: [number, number];
  /** True when the BAN result is a commune (not a precise address). */
  isCity: boolean;
  /** Raw BAN feature for callers that need the full geocoding metadata. */
  feature: BANAddressFeature;
};

type AddressSearchInputProps = {
  onSelect: (selection: AddressSelection) => void;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
};

/** BAN-only autocomplete. For combined address + network search use `<MapSearchInput>`. */
export function AddressSearchInput({ onSelect, defaultValue, placeholder, className }: AddressSearchInputProps) {
  const [error, setError] = useState(false);

  const handleSelected: AddressFieldProps['onSelect'] = (feature) => {
    if (!feature) {
      return;
    }
    setError(false);
    trackPostHogEvent('map:address_searched');
    const [lng, lat] = feature.geometry.coordinates;
    onSelect({
      coordinates: [lng, lat],
      feature,
      isCity: feature.properties.label === feature.properties.city,
      label: feature.properties.label,
    });
  };

  return (
    <AddressField
      label=""
      className={className}
      state={error ? 'error' : undefined}
      stateRelatedMessage={error ? <div>Une erreur est survenue. Réessayez ou contactez le support.</div> : undefined}
      defaultValue={defaultValue ?? ''}
      nativeInputProps={{ placeholder: placeholder ?? 'Ex: 5 Rue Censier 75005 Paris' }}
      onSelect={handleSelected}
      onClear={() => setError(false)}
    />
  );
}
