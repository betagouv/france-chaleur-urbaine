import { useContext, useMemo } from 'react';

import { getProperty } from '@/utils/core';
import type { Interval } from '@/utils/interval';

import { MapConfigContext } from './MapConfigProvider';
import type { MapConfiguration, MapConfigurationProperty } from './map-configuration';

/**
 * Read + mutate the active `MapConfiguration` from inside a `<MapConfigProvider>`.
 *
 * The signatures mirror V1's `useFCUMap` (`toggleLayer`, `updateProperty`,
 * `updateScaleInterval`) so migration of legend sections is a near-direct
 * `useFCUMap` → `useMapConfig` swap. Paths are statically typed through
 * `MapConfigurationProperty<T>` — typos and stale paths fail at compile time.
 *
 * Also exposes `read(path)` for reading a single field by path (e.g. the
 * `<LegendCheckbox path="…" />` primitive).
 */
export function useMapConfig() {
  const ctx = useContext(MapConfigContext);
  if (!ctx) {
    throw new Error('useMapConfig() must be called from inside a <MapConfigProvider>.');
  }
  const { config, dispatch } = ctx;

  return useMemo(
    () => ({
      config,
      read: <T>(path: MapConfigurationProperty<T>): T => getProperty<MapConfiguration, T>(config, path) as T,
      setConfig: (next: MapConfiguration) => dispatch({ config: next, type: 'replace' }),
      toggleLayer: (path: MapConfigurationProperty<boolean>) => dispatch({ path, type: 'toggleLayer' }),
      updateInterval: (path: MapConfigurationProperty<Interval>) => (interval: Interval) =>
        dispatch({ interval, path, type: 'updateInterval' }),
      updateProperty: <T>(path: MapConfigurationProperty<T>, value: T) => dispatch({ path, type: 'updateProperty', value }),
    }),
    [config, dispatch]
  );
}
