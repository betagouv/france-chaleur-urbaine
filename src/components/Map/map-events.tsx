import { booleanPointInPolygon } from '@turf/boolean-point-in-polygon';
import { distance } from '@turf/distance';
import { explode } from '@turf/explode';
import { lineString, point } from '@turf/helpers';
import { nearestPoint } from '@turf/nearest-point';
import { nearestPointOnLine } from '@turf/nearest-point-on-line';
import { type Feature, type Geometry, type GeometryCollection, type Point, type Position } from 'geojson';
import { type MapGeoJSONFeature } from 'maplibre-gl';
import { useEffect, useRef, useState } from 'react';
import { type MapMouseEvent, type MapRef, Popup } from 'react-map-gl/maplibre';

import { isDevModeEnabled } from '@/hooks/useDevMode';
import { type SourceId } from '@/server/services/tiles.config';
import { isDefined } from '@/utils/core';

import { buildPopupStyleHelpers } from './layers/common';
import { mapLayers, type MapLayerSpecification } from './map-layers';

const selectionBuffer = 15; // pixels

const selectableLayers = mapLayers.flatMap((spec) =>
  spec.layers
    .filter((layer) => !(('unselectable' satisfies keyof MapLayerSpecification) in layer))
    .map((layer) => ({
      sourceId: spec.sourceId,
      sourceLayer: ('source-layer' satisfies keyof MapLayerSpecification) in layer ? layer['source-layer'] : 'layer',
      layerId: layer.id,
    }))
);

type UseMapEventsProps = {
  mapLayersLoaded: boolean;
  isDrawing: boolean;
  mapRef: MapRef | null;
  onFeatureClick?: (feature: MapGeoJSONFeature) => void;
};

/**
 * Register mouse events (move and click).
 */
export function useMapEvents({ mapLayersLoaded, isDrawing, mapRef, onFeatureClick }: UseMapEventsProps) {
  const [popupComponent, setPopupComponent] = useState<(() => JSX.Element) | null>(null);

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
      const { feature: hoveredFeature } = findHoveredFeature(mapRef, event.point.x, event.point.y);

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
      const { feature: hoveredFeature, snapPoint } = findHoveredFeature(mapRef, event.point.x, event.point.y);
      if (!hoveredFeature) {
        return;
      }

      if (isDevModeEnabled()) {
        console.log('map-click', hoveredFeature); // eslint-disable-line no-console
      }

      const layerSpec = mapLayers
        .flatMap<MapLayerSpecification>((spec) => spec.layers)
        .find((layerSpec) => layerSpec.id === hoveredFeature.layer.id);
      // should not happen, we could probably improve typing here
      if (!layerSpec) {
        throw new Error(`Layer ${hoveredFeature.layer.id} not found. Strange oO`);
      }
      if (!isDefined(layerSpec.popup)) {
        throw new Error(`Layer.popup ${hoveredFeature.layer.id} not found. Strange oO`);
      }
      const popupFunc = layerSpec.popup;

      onFeatureClick?.(hoveredFeature);

      setPopupComponent(() => (
        <Popup
          longitude={snapPoint[0]}
          latitude={snapPoint[1]}
          offset={layerSpec.popupOffset}
          closeButton={false} // manual handling
          key={Math.random()} // force the popup to resfresh
        >
          {popupFunc(
            hoveredFeature.properties,
            buildPopupStyleHelpers(() => setPopupComponent(() => null))
          )}
        </Popup>
      ));
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

  // reset the cursor style and the hovered feature state when starting to draw
  useEffect(() => {
    if (!mapLayersLoaded || !mapRef) {
      return;
    }

    if (isDrawing && lastHoveredFeatureRef.current !== null) {
      mapRef.getCanvas().style.cursor = '';
      mapRef.setFeatureState(
        {
          source: lastHoveredFeatureRef.current.source,
          sourceLayer: lastHoveredFeatureRef.current.sourceLayer,
          id: lastHoveredFeatureRef.current.id,
        },
        { hover: false }
      );
    }
  }, [mapLayersLoaded, isDrawing]);

  return {
    Popup: popupComponent,
  };
}

function findHoveredFeature(
  mapRef: MapRef,
  cursorX: number,
  cursorY: number
): { feature: MapGeoJSONFeature; snapPoint: Position } | { feature: null; snapPoint: null } {
  const hoveredFeatures = mapRef.queryRenderedFeatures(
    [
      [cursorX - selectionBuffer, cursorY - selectionBuffer],
      [cursorX + selectionBuffer, cursorY + selectionBuffer],
    ],
    { layers: selectableLayers.map((spec) => spec.layerId) }
  );

  if (hoveredFeatures.length === 0) {
    return { feature: null, snapPoint: null };
  }

  const cursorPoint = point(mapRef.unproject([cursorX, cursorY]).toArray());

  const { feature, snapPoint } = hoveredFeatures.reduce(
    (closest, feature) => {
      const priority = hoverPriority[(feature.geometry as BasicGeometry).type];
      const { distance, snapPoint } = getNearestGeometryPoint(feature.geometry as BasicGeometry, cursorPoint);
      return priority < closest.priority || (priority === closest.priority && distance < closest.distance)
        ? {
            distance,
            snapPoint,
            feature,
            priority,
          }
        : closest;
    },
    {
      feature: null as unknown as MapGeoJSONFeature,
      snapPoint: null as unknown as Position,
      distance: Infinity,
      priority: Infinity,
    }
  );
  return { feature, snapPoint };
}

type BasicGeometry = Exclude<Geometry, GeometryCollection>;
type GeometryNearestPointHandlers = {
  [K in BasicGeometry['type']]: (
    geometry: Extract<BasicGeometry, { type: K }>,
    point: Feature<Point>
  ) => {
    snapPoint: Position;
    distance: number;
  };
};

type ClosestPointResult = {
  snapPoint: Position;
  distance: number;
};

const geometryNearestPointHandlers: GeometryNearestPointHandlers = {
  Point: (geometry, point) => {
    return {
      snapPoint: geometry.coordinates,
      distance: distance(point, geometry, { units: 'meters' }),
    };
  },
  MultiPoint: (geometry, point) => {
    const nearest = nearestPoint(point, explode(geometry), { units: 'meters' });
    return {
      snapPoint: nearest.geometry.coordinates,
      distance: nearest.properties.distanceToPoint,
    };
  },
  LineString: (geometry, point) => {
    const snapPoint = nearestPointOnLine(geometry, point, { units: 'meters' });
    return {
      snapPoint: snapPoint.geometry.coordinates,
      distance: snapPoint.properties.dist,
    };
  },
  MultiLineString: (geometry, point) => {
    const snapPoint = nearestPointOnLine(geometry, point, { units: 'meters' });
    return {
      snapPoint: snapPoint.geometry.coordinates,
      distance: snapPoint.properties.dist,
    };
  },
  Polygon: (geometry, point) => {
    if (booleanPointInPolygon(point, geometry)) {
      return {
        snapPoint: point.geometry.coordinates,
        distance: 0,
      };
    }

    const closest = geometry.coordinates.reduce<ClosestPointResult>(
      (closestSoFar, ring) => {
        const snapPoint = nearestPointOnLine(lineString(ring), point, { units: 'meters' });
        const distance = snapPoint.properties.dist;
        return distance < closestSoFar.distance
          ? {
              snapPoint: snapPoint.geometry.coordinates,
              distance,
            }
          : closestSoFar;
      },
      { snapPoint: [Infinity, Infinity], distance: Infinity }
    );
    return closest;
  },
  MultiPolygon: (geometry, point) => {
    if (booleanPointInPolygon(point, geometry)) {
      return {
        snapPoint: point.geometry.coordinates,
        distance: 0,
      };
    }
    const closest = geometry.coordinates.reduce<ClosestPointResult>(
      (closestSoFar, polygonCoords) => {
        const closestForPolygon = polygonCoords.reduce<ClosestPointResult>(
          (closestPolygon, ring) => {
            const snapPoint = nearestPointOnLine(lineString(ring), point, { units: 'meters' });
            const distance = snapPoint.properties.dist;
            return distance < closestPolygon.distance
              ? {
                  snapPoint: snapPoint.geometry.coordinates,
                  distance,
                }
              : closestPolygon;
          },
          { snapPoint: [Infinity, Infinity], distance: Infinity }
        );

        return closestForPolygon.distance < closestSoFar.distance ? closestForPolygon : closestSoFar;
      },
      { snapPoint: [Infinity, Infinity], distance: Infinity }
    );

    return closest;
  },
};

const getNearestGeometryPoint = (
  geometry: BasicGeometry,
  point: Feature<Point>
): {
  snapPoint: Position;
  distance: number;
} => {
  return geometryNearestPointHandlers[geometry.type](geometry as any, point);
};

const hoverPriority: Record<BasicGeometry['type'], number> = {
  Point: 1,
  MultiPoint: 1,
  LineString: 2,
  MultiLineString: 2,
  Polygon: 3,
  MultiPolygon: 3,
};
