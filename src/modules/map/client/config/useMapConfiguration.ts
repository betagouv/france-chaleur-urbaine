import { useMemo } from 'react';

import { createMapConfiguration, type MapConfiguration } from '@/components/Map/map-configuration';
import trpc from '@/modules/trpc/client';
import type { DeepPartial } from '@/utils/typescript';

/**
 * Resolves a full `MapConfiguration` by fetching the réseaux-de-chaleur limits
 * via tRPC and merging them with `partial`. Returns `null` while the query is
 * in flight.
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
