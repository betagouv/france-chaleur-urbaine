import { parseAsJson, useQueryState } from 'nuqs';
import { useEffect } from 'react';

import { useMapConfig } from '../config/useMapConfig';
import { serializeActiveFilters } from '../legend/ReseauxDeChaleurFilters';

/**
 * Persists the active réseaux-de-chaleur filters into `?rdc_filters=` (the JSON
 * shape consumed by `/reseaux`). Writes on every filter change; the initial
 * decode (URL → config) is done by the host page when building the map `config`.
 * Mount as a child of `<Map>` (needs the Jotai config store).
 */
export function ReseauxFiltersUrlSync() {
  const { config } = useMapConfig();
  const [, setUrlFilters] = useQueryState(
    'rdc_filters',
    parseAsJson((value) => value as Record<string, unknown>)
  );

  useEffect(() => {
    const active = serializeActiveFilters(config);
    void setUrlFilters(Object.keys(active).length > 0 ? active : null, { history: 'replace' });
  }, [config.reseauxDeChaleur, config.filtreGestionnaire, config.filtreMaitreOuvrage, setUrlFilters]);

  return null;
}
