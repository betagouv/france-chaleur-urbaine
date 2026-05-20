import type maplibregl from 'maplibre-gl';
import { createContext, useContext } from 'react';

import type { MapCanvasController } from './controller';

/** Sources/layers added by `useConfiguredLayers`; preserved across `setStyle` via `transformStyle`. */
export type UserResources = {
  sources: Set<string>;
  layers: Set<string>;
};

type MapCanvasContextValue = {
  map: maplibregl.Map;
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

export function useMapInstance() {
  return useMapCanvasContext().map;
}

export function useMapCanvasController() {
  return useMapCanvasContext().controller;
}

/** True once the style is loaded — layer setup should gate on this. */
export function useMapReady() {
  return useMapCanvasContext().mapReady;
}

export function useUserResources() {
  return useMapCanvasContext().userResources;
}
