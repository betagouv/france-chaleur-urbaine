import { MapGeoJSONFeature } from 'maplibre-gl';
import { useEffect } from 'react';
import { MapMouseEvent, MapRef } from 'react-map-gl/maplibre';

import { SourceId } from 'src/services/tiles.config';

import { LayerId } from './map-layers';

let hoveredStateId: MapGeoJSONFeature['id'] | null = null;

type HoverConfig = {
  source: SourceId;
  sourceLayer: string;
  layer: LayerId;
};

const hoverConfigs: HoverConfig[] = [
  {
    layer: 'reseauxDeChaleur-avec-trace',
    source: 'network',
    sourceLayer: 'layer',
  },
  {
    layer: 'reseauxEnConstruction-trace',
    source: 'futurNetwork',
    sourceLayer: 'futurOutline',
  },
  {
    layer: 'reseauxDeFroid-avec-trace',
    source: 'coldNetwork',
    sourceLayer: 'coldOutline',
  },
];

type UseMapHoverConfigProps = {
  mapLayersLoaded: boolean;
  isDrawing: boolean;
  mapRef: MapRef | null;
};

/**
 * Register hover effects.
 */
export function useMapHoverEffects({ mapLayersLoaded, isDrawing, mapRef }: UseMapHoverConfigProps) {
  useEffect(() => {
    if (!mapLayersLoaded || !mapRef || isDrawing) {
      return;
    }

    /**
     * The hover state is used in the layers to change the style of the feature using ['feature-state', 'hover']
     */
    const setFeatureHoveringState = (map: MapRef, hover: boolean, source: SourceId, sourceLayer: string) => {
      if (hoveredStateId) {
        map.setFeatureState(
          {
            source,
            id: hoveredStateId,
            sourceLayer,
          },
          { hover }
        );
        if (!hover) {
          hoveredStateId = null;
        }
      }
    };

    const hoverConfigsWithCallbacks = hoverConfigs.map((config) => {
      return {
        layer: config.layer,
        onMouseEnter: (
          event: MapMouseEvent & {
            features?: MapGeoJSONFeature[];
          }
        ) => {
          if (event.features && event.features.length > 0) {
            setFeatureHoveringState(mapRef, false, config.source, config.sourceLayer);
            hoveredStateId = event.features[0].id;
            setFeatureHoveringState(mapRef, true, config.source, config.sourceLayer);
          }
        },
        onMouseLeave: () => {
          setFeatureHoveringState(mapRef, false, config.source, config.sourceLayer);
        },
      };
    });

    hoverConfigsWithCallbacks.forEach((config) => {
      mapRef.on('mouseenter', config.layer, config.onMouseEnter);
      mapRef.on('mouseleave', config.layer, config.onMouseLeave);
    });

    return () => {
      hoverConfigsWithCallbacks.forEach((config) => {
        mapRef.off('mouseenter', config.layer, config.onMouseEnter);
        mapRef.off('mouseleave', config.layer, config.onMouseLeave);
      });
    };
  }, [mapLayersLoaded, isDrawing]);
}
