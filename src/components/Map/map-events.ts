import { type MapGeoJSONFeature } from 'maplibre-gl';
import { useEffect, useRef, useState } from 'react';
import { type MapMouseEvent, type MapRef } from 'react-map-gl/maplibre';

import { isDevModeEnabled } from '@/hooks/useDevMode';
import { type SourceId } from '@/server/services/tiles.config';
import { type MapPopupInfos } from '@/types/MapComponentsInfos';

import { layersWithDynamicContentPopup } from './components/DynamicMapPopupContent';
import { type LayerId, mapLayers, type MapLayerSpecification } from './map-layers';

type UseMapEventsProps = {
  mapLayersLoaded: boolean;
  isDrawing: boolean;
  mapRef: MapRef | null;
};

const selectionBuffer = 10; // pixels

const selectableLayers = mapLayers.flatMap((spec) =>
  spec.layers
    .filter((layer) => !(('unselectable' satisfies keyof MapLayerSpecification) in layer))
    .map((layer) => ({
      sourceId: spec.sourceId,
      sourceLayer: ('source-layer' satisfies keyof MapLayerSpecification) in layer ? layer['source-layer'] : 'layer',
      layerId: layer.id,
    }))
);

/**
 * These popups use the same template but with lots of specifics.
 */
const legacyPopupConfigs: {
  layer: LayerId;
  key: string;
}[] = [
  { layer: 'reseauxDeChaleur-avec-trace', key: 'network' },
  { layer: 'reseauxDeChaleur-sans-trace', key: 'network' },
  { layer: 'reseauxDeFroid-avec-trace', key: 'coldNetwork' },
  { layer: 'reseauxDeFroid-sans-trace', key: 'coldNetwork' },
  { layer: 'reseauxEnConstruction-trace', key: 'futurNetwork' },
  { layer: 'reseauxEnConstruction-zone', key: 'futurNetwork' },
  {
    layer: 'demandesEligibilite',
    key: 'demands',
  },
  { layer: 'caracteristiquesBatiments', key: 'buildings' },
  { layer: 'consommationsGaz', key: 'consommation' },
  { layer: 'energy', key: 'energy' },
];

/**
 * Register mouse events (move and click).
 */
export function useMapEvents({ mapLayersLoaded, isDrawing, mapRef }: UseMapEventsProps) {
  const [popupInfos, setPopupInfos] = useState<MapPopupInfos>();
  const lastHoveredFeatureRef = useRef<{
    source: SourceId;
    sourceLayer?: string;
    id: MapGeoJSONFeature['id'];
  } | null>(null);

  useEffect(() => {
    if (!mapLayersLoaded || !mapRef || isDrawing) {
      return;
    }

    const onMouseMove = (event: MapMouseEvent) => {
      const hoveredFeatures = mapRef.queryRenderedFeatures(
        [
          [event.point.x - selectionBuffer, event.point.y - selectionBuffer],
          [event.point.x + selectionBuffer, event.point.y + selectionBuffer],
        ],
        { layers: selectableLayers.map((spec) => spec.layerId) }
      );

      const hoveredFeature = hoveredFeatures[0];

      // update the cursor style
      mapRef.getCanvas().style.cursor = hoveredFeature ? 'pointer' : '';

      // reset the hover state if the hovered feature has changed
      if (lastHoveredFeatureRef.current !== null && lastHoveredFeatureRef.current.id !== hoveredFeature?.id) {
        mapRef.setFeatureState(
          {
            source: lastHoveredFeatureRef.current.source,
            sourceLayer: lastHoveredFeatureRef.current.sourceLayer,
            id: lastHoveredFeatureRef.current.id,
          },
          { hover: false }
        );
      }

      // set the hover state on the hovered feature
      if (lastHoveredFeatureRef.current?.id !== hoveredFeature?.id) {
        if (hoveredFeature) {
          mapRef.setFeatureState(
            { source: hoveredFeature.source, sourceLayer: hoveredFeature.sourceLayer, id: hoveredFeature.id },
            { hover: true }
          );
        }

        lastHoveredFeatureRef.current = hoveredFeature
          ? {
              source: hoveredFeature.source as SourceId,
              sourceLayer: hoveredFeature.sourceLayer,
              id: hoveredFeature.id,
            }
          : null;
      }
    };

    const onMouseClick = (event: MapMouseEvent) => {
      const hoveredFeatures = mapRef.queryRenderedFeatures(
        [
          [event.point.x - selectionBuffer, event.point.y - selectionBuffer],
          [event.point.x + selectionBuffer, event.point.y + selectionBuffer],
        ],
        { layers: selectableLayers.map((spec) => spec.layerId) }
      );

      const hoveredFeature = hoveredFeatures[0];
      if (hoveredFeature) {
        if (isDevModeEnabled()) {
          console.log('map-click', hoveredFeature); // eslint-disable-line no-console
        }

        // depending on the feature type, we force the popup type to help building the popup content more easily
        setPopupInfos({
          latitude: event.lngLat.lat,
          longitude: event.lngLat.lng,
          content: layersWithDynamicContentPopup.includes(hoveredFeature.layer?.id as (typeof layersWithDynamicContentPopup)[number])
            ? {
                type: hoveredFeature.layer?.id,
                properties: hoveredFeature.properties,
              }
            : { [legacyPopupConfigs.find((f) => f.layer === hoveredFeature.layer.id)!.key]: hoveredFeature.properties },
        });
      }
    };

    mapRef.on('mousemove', onMouseMove);
    mapRef.on('click', onMouseClick);
    mapRef.on('touchend', onMouseClick);

    return () => {
      mapRef.off('mousemove', onMouseMove);
      mapRef.off('click', onMouseClick);
      mapRef.off('touchend', onMouseClick);
    };
  }, [mapLayersLoaded, isDrawing]);

  return {
    popupInfos,
  };
}
