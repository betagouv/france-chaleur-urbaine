import { createContext, type Dispatch, type ReactNode, useEffect, useMemo, useReducer } from 'react';

import { setProperty, toggleBoolean } from '@/utils/core';
import type { Interval } from '@/utils/interval';
import type { DeepPartial } from '@/utils/typescript';

import type { MapConfiguration, MapConfigurationProperty } from './map-configuration';
import { useMapConfiguration } from './useMapConfiguration';

export type MapConfigAction =
  | { type: 'toggleLayer'; path: MapConfigurationProperty<boolean> }
  | { type: 'updateProperty'; path: MapConfigurationProperty<unknown>; value: unknown }
  | { type: 'updateInterval'; path: MapConfigurationProperty<Interval>; interval: Interval }
  | { type: 'replace'; config: MapConfiguration };

type ContextValue = {
  config: MapConfiguration;
  dispatch: Dispatch<MapConfigAction>;
};

export const MapConfigContext = createContext<ContextValue | null>(null);

function reducer(state: MapConfiguration, action: MapConfigAction): MapConfiguration {
  switch (action.type) {
    case 'replace':
      return action.config;
    case 'toggleLayer': {
      // structuredClone is fine — MapConfiguration is small (~50 leaf keys),
      // mutations are bursty (user interaction), and we get safe immutability
      // for free without dragging in immer.
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

type MapConfigProviderProps = {
  /** Same shape as the `partial` passed to `useMapConfiguration`. */
  partial: DeepPartial<MapConfiguration>;
  children: ReactNode;
};

/**
 * Owns the `MapConfiguration` state for an interactive map page. Fetches the
 * réseaux-de-chaleur limits via `useMapConfiguration`, then exposes the config
 * + a typed dispatcher through context.
 *
 * Consumers use `useMapConfig()` to read or mutate. The carte components
 * (`<Map>`, `<MapCanvas>`, …) remain agnostic — they still take `config` as a
 * prop. Only the legend / interactive widgets depend on this provider.
 *
 * Renders `null` while the limits query is in flight (same behaviour as
 * `useMapConfiguration`).
 */
export function MapConfigProvider({ partial, children }: MapConfigProviderProps) {
  const initial = useMapConfiguration(partial);
  if (!initial) {
    return null;
  }
  return <MapConfigProviderInner initial={initial}>{children}</MapConfigProviderInner>;
}

function MapConfigProviderInner({ initial, children }: { initial: MapConfiguration; children: ReactNode }) {
  const [config, dispatch] = useReducer(reducer, initial);

  // If the limits ever change at runtime (different `partial` from the caller,
  // tRPC cache invalidation, etc.), refresh the config without losing the
  // user's mutations on other keys. In practice this rarely fires after the
  // initial mount, but it's cheap.
  useEffect(() => {
    if (initial !== config && initial.reseauxDeChaleur.limits !== config.reseauxDeChaleur.limits) {
      dispatch({ config: initial, type: 'replace' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  const value = useMemo(() => ({ config, dispatch }), [config]);

  return <MapConfigContext.Provider value={value}>{children}</MapConfigContext.Provider>;
}
