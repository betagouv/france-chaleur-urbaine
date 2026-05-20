import { atom, useAtomValue, useSetAtom } from 'jotai';
import { useMemo } from 'react';

import { getProperty, setProperty, toggleBoolean } from '@/utils/core';
import type { Interval } from '@/utils/interval';

import type { MapConfiguration, MapConfigurationProperty } from './map-configuration';

export type MapConfigAction =
  | { type: 'toggleLayer'; path: MapConfigurationProperty<boolean> }
  | { type: 'updateProperty'; path: MapConfigurationProperty<unknown>; value: unknown }
  | { type: 'updateInterval'; path: MapConfigurationProperty<Interval>; interval: Interval }
  | { type: 'replace'; config: MapConfiguration };

/** `null` until `<MapStoreProvider>` hydrates it from the `useMapConfiguration` query. */
export const mapConfigAtom = atom<MapConfiguration | null>(null);

export const mapConfigDispatchAtom = atom(null, (get, set, action: MapConfigAction) => {
  const current = get(mapConfigAtom);
  if (!current) return;
  set(mapConfigAtom, reducer(current, action));
});

function reducer(state: MapConfiguration, action: MapConfigAction): MapConfiguration {
  switch (action.type) {
    case 'replace':
      return action.config;
    case 'toggleLayer': {
      const next = structuredClone(state);
      toggleBoolean(next, action.path);
      return next;
    }
    case 'updateProperty': {
      const next = structuredClone(state);
      setProperty(next, action.path, action.value);
      return next;
    }
    case 'updateInterval': {
      const next = structuredClone(state);
      setProperty(next, action.path, action.interval);
      return next;
    }
  }
}

/** Read + mutate the active `MapConfiguration`. Must be called below `<MapStoreProvider>`. */
export function useMapConfig() {
  const config = useAtomValue(mapConfigAtom);
  const dispatch = useSetAtom(mapConfigDispatchAtom);

  if (!config) {
    throw new Error('useMapConfig() must be called from inside a <MapStoreProvider>.');
  }

  // Setters depend on `dispatch` only (stable), so they're memoised
  // independently of `config` and stay referentially stable across config changes.
  const setters = useMemo(
    () => ({
      setConfig: (next: MapConfiguration) => dispatch({ config: next, type: 'replace' }),
      toggleLayer: (path: MapConfigurationProperty<boolean>) => dispatch({ path, type: 'toggleLayer' }),
      updateInterval: (path: MapConfigurationProperty<Interval>) => (interval: Interval) =>
        dispatch({ interval, path, type: 'updateInterval' }),
      updateProperty: <T>(path: MapConfigurationProperty<T>, value: T) => dispatch({ path, type: 'updateProperty', value }),
    }),
    [dispatch]
  );

  return useMemo(
    () => ({
      config,
      read: <T>(path: MapConfigurationProperty<T>): T => getProperty<MapConfiguration, T>(config, path) as T,
      ...setters,
    }),
    [config, setters]
  );
}
