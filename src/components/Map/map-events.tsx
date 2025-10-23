import { booleanPointInPolygon } from '@turf/boolean-point-in-polygon';
import { distance } from '@turf/distance';
import { explode } from '@turf/explode';
import { lineString, point } from '@turf/helpers';
import { nearestPoint } from '@turf/nearest-point';
import { nearestPointOnLine } from '@turf/nearest-point-on-line';
import type { Feature, Geometry, GeometryCollection, Point, Position } from 'geojson';
import type { MapGeoJSONFeature } from 'maplibre-gl';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { type MapMouseEvent, type MapRef, Popup } from 'react-map-gl/maplibre';

import { isDevModeEnabled } from '@/hooks/useDevMode';
import { useAuthentication } from '@/modules/auth/client/hooks';
import type { SourceId } from '@/modules/tiles/tiles.config';
import { isDefined } from '@/utils/core';

import { buildPopupStyleHelpers, mapEventBus, type PopupContext } from './layers/common';
import { type MapLayerSpecification, mapLayers } from './map-layers';

const selectionBuffer = 15; // pixels

const selectableLayers = mapLayers.flatMap((spec) =>
  spec.layers
    .filter((layer) => !(('unselectable' satisfies keyof MapLayerSpecification) in layer))
    .map((layer) => ({
      layerId: layer.id,
      sourceId: spec.sourceId,
      sourceLayer: ('source-layer' satisfies keyof MapLayerSpecification) in layer ? layer['source-layer'] : 'layer',
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
  const { hasRole, isAuthenticated } = useAuthentication();
  const pathname = usePathname();

  const popupContext: PopupContext = useMemo(
    () => ({ hasRole, isAuthenticated, mapEventBus, pathname: pathname ?? '__UNDEFINED_YET__' }),
    [hasRole, isAuthenticated]
  );

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
            id: lastHoveredFeatureRef.current.id,
            source: lastHoveredFeatureRef.current.source,
            sourceLayer: lastHoveredFeatureRef.current.sourceLayer,
          },
          { hover: false }
        );
      }

      // set the hover state on the hovered feature
      if (lastHoveredFeatureRef.current?.id !== hoveredFeature?.id) {
        if (hoveredFeature) {
          mapRef.setFeatureState(
            { id: hoveredFeature.id, source: hoveredFeature.source, sourceLayer: hoveredFeature.sourceLayer },
            { hover: true }
          );
        }

        lastHoveredFeatureRef.current = hoveredFeature
          ? {
              id: hoveredFeature.id,
              source: hoveredFeature.source as SourceId,
              sourceLayer: hoveredFeature.sourceLayer,
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
            buildPopupStyleHelpers(() => setPopupComponent(() => null)),
            popupContext
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
          id: lastHoveredFeatureRef.current.id,
          source: lastHoveredFeatureRef.current.source,
          sourceLayer: lastHoveredFeatureRef.current.sourceLayer,
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
            feature,
            priority,
            snapPoint,
          }
        : closest;
    },
    {
      distance: Infinity,
      feature: null as unknown as MapGeoJSONFeature,
      priority: Infinity,
      snapPoint: null as unknown as Position,
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
  LineString: (geometry, point) => {
    const snapPoint = nearestPointOnLine(geometry, point, { units: 'meters' });
    return {
      distance: snapPoint.properties.dist,
      snapPoint: snapPoint.geometry.coordinates,
    };
  },
  MultiLineString: (geometry, point) => {
    const snapPoint = nearestPointOnLine(geometry, point, { units: 'meters' });
    return {
      distance: snapPoint.properties.dist,
      snapPoint: snapPoint.geometry.coordinates,
    };
  },
  MultiPoint: (geometry, point) => {
    const nearest = nearestPoint(point, explode(geometry), { units: 'meters' });
    return {
      distance: nearest.properties.distanceToPoint,
      snapPoint: nearest.geometry.coordinates,
    };
  },
  MultiPolygon: (geometry, point) => {
    if (booleanPointInPolygon(point, geometry)) {
      return {
        distance: 0,
        snapPoint: point.geometry.coordinates,
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
                  distance,
                  snapPoint: snapPoint.geometry.coordinates,
                }
              : closestPolygon;
          },
          { distance: Infinity, snapPoint: [Infinity, Infinity] }
        );

        return closestForPolygon.distance < closestSoFar.distance ? closestForPolygon : closestSoFar;
      },
      { distance: Infinity, snapPoint: [Infinity, Infinity] }
    );

    return closest;
  },
  Point: (geometry, point) => {
    return {
      distance: distance(point, geometry, { units: 'meters' }),
      snapPoint: geometry.coordinates,
    };
  },
  Polygon: (geometry, point) => {
    if (booleanPointInPolygon(point, geometry)) {
      return {
        distance: 0,
        snapPoint: point.geometry.coordinates,
      };
    }

    const closest = geometry.coordinates.reduce<ClosestPointResult>(
      (closestSoFar, ring) => {
        const snapPoint = nearestPointOnLine(lineString(ring), point, { units: 'meters' });
        const distance = snapPoint.properties.dist;
        return distance < closestSoFar.distance
          ? {
              distance,
              snapPoint: snapPoint.geometry.coordinates,
            }
          : closestSoFar;
      },
      { distance: Infinity, snapPoint: [Infinity, Infinity] }
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
  LineString: 2,
  MultiLineString: 2,
  MultiPoint: 1,
  MultiPolygon: 3,
  Point: 1,
  Polygon: 3,
};
