import type maplibregl from 'maplibre-gl';
import type { StyleSpecification } from 'maplibre-gl';

import type { BBox, LngLat } from '../../shared/types';
import type { UserResources } from './MapCanvasContext';

export type MapCanvasController = {
  /** Escape hatch — prefer the typed methods below. */
  getMap: () => maplibregl.Map;
  flyTo: (center: LngLat, options?: { zoom?: number; duration?: number }) => void;
  fitBounds: (bbox: BBox, options?: { padding?: number; duration?: number; maxZoom?: number }) => void;
  /** Switches the base style while preserving user-added sources/layers via `transformStyle`. */
  setStyle: (style: StyleSpecification) => void;
  on: maplibregl.Map['on'];
  off: maplibregl.Map['off'];
};

export function createMapCanvasController(map: maplibregl.Map, userResources: UserResources): MapCanvasController {
  return {
    fitBounds: (bbox, options) => {
      map.fitBounds(
        [
          [bbox[0], bbox[1]],
          [bbox[2], bbox[3]],
        ],
        { duration: options?.duration ?? 0, maxZoom: options?.maxZoom, padding: options?.padding ?? 40 }
      );
    },
    flyTo: (center, options) => {
      map.flyTo({ center, duration: options?.duration ?? 1200, zoom: options?.zoom });
    },
    getMap: () => map,
    off: map.off.bind(map),
    on: map.on.bind(map),
    setStyle: (newSpec) => {
      map.setStyle(newSpec, {
        diff: false,
        transformStyle: (previousStyle, nextStyle) => {
          if (!previousStyle) {
            return nextStyle;
          }
          const preservedSources = Object.fromEntries(
            Object.entries(previousStyle.sources ?? {}).filter(([id]) => userResources.sources.has(id))
          );
          const preservedLayers = (previousStyle.layers ?? []).filter((layer) => userResources.layers.has(layer.id));
          return {
            ...nextStyle,
            layers: [...(nextStyle.layers ?? []), ...preservedLayers],
            sources: { ...nextStyle.sources, ...preservedSources },
          };
        },
      });
    },
  };
}
