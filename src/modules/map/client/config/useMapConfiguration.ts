import { useMemo } from 'react';

import { createMapConfiguration, type MapConfiguration } from '@/components/Map/map-configuration';
import trpc from '@/modules/trpc/client';
import type { DeepPartial } from '@/utils/typescript';

/**
 * Builds a fully-initialized `MapConfiguration` by fetching the réseaux-de-chaleur
 * limits (min/max per filterable dimension) via tRPC and merging them with the
 * partial config provided by the caller.
 *
 * Returns `null` while the limits query is still in flight. Callers typically pass
 * `config ?? undefined` to `<MapCanvas>` so the base map renders immediately and
 * the layers mount only once the config is ready.
 */
export function useMapConfiguration(partial: DeepPartial<MapConfiguration>): MapConfiguration | null {
  const { data: limits } = trpc.reseaux.networkLimits.useQuery();

  return useMemo(() => {
    if (!limits) {
      return null;
    }
    return createMapConfiguration({
      ...partial,
      reseauxDeChaleur: {
        ...limits,
        ...partial.reseauxDeChaleur,
        limits,
      },
    });
  }, [limits, partial]);
}
