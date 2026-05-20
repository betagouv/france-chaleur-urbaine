import type maplibregl from 'maplibre-gl';
import { createContext, useContext } from 'react';

import type { MapCanvasController } from './controller';

/**
 * Tracks the ids of sources and layers added by `useConfiguredLayers` (and any
 * future dynamic-layer primitives). The controller uses these sets at `setStyle`
 * time to atomically preserve user content via MapLibre's `transformStyle` —
 * base-style sources/layers from the previous style are not carried over.
 */
export type UserResources = {
  sources: Set<string>;
  layers: Set<string>;
};

type MapCanvasContextValue = {
  map: maplibregl.Map;
  /** True once the map fired its first `load` event (style + base sources ready). */
  mapReady: boolean;
  controller: MapCanvasController;
  userResources: UserResources;
};

export const MapCanvasContext = createContext<MapCanvasContextValue | null>(null);

function useMapCanvasContext() {
  const context = useContext(MapCanvasContext);
  if (!context) {
    throw new Error('Hook must be called from a component rendered inside <MapCanvas>.');
  }
  return context;
}

/** Access the MapLibre instance attached to the nearest `<MapCanvas>` ancestor. */
export function useMapInstance() {
  return useMapCanvasContext().map;
}

/** Access the imperative controller for the nearest `<MapCanvas>` ancestor. */
export function useMapCanvasController() {
  return useMapCanvasContext().controller;
}

/** True once the map's style is fully loaded. Layer setup should gate on this. */
export function useMapReady() {
  return useMapCanvasContext().mapReady;
}

/** Internal — ownership tracking used by `useConfiguredLayers`. */
export function useUserResources() {
  return useMapCanvasContext().userResources;
}
