import { createStore, Provider as JotaiProvider } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';
import { type ReactNode, useMemo } from 'react';

import type { DeepPartial } from '@/utils/typescript';

import type { MapConfiguration } from './config/map-configuration';
import { mapConfigAtom } from './config/useMapConfig';
import { useMapConfiguration } from './config/useMapConfiguration';

type MapStoreProviderProps = {
  partial: DeepPartial<MapConfiguration>;
  children: ReactNode;
};

/**
 * Per-`<Map>` Jotai store + initial `MapConfiguration` hydration. Renders
 * `null` while the réseaux-de-chaleur limits query is in flight.
 */
export function MapStoreProvider({ partial, children }: MapStoreProviderProps) {
  const initial = useMapConfiguration(partial);
  const store = useMemo(() => createStore(), []);

  if (!initial) return null;

  return (
    <JotaiProvider store={store}>
      <ConfigHydrator initial={initial}>{children}</ConfigHydrator>
    </JotaiProvider>
  );
}

function ConfigHydrator({ initial, children }: { initial: MapConfiguration; children: ReactNode }) {
  useHydrateAtoms([[mapConfigAtom, initial]]);
  return <>{children}</>;
}
