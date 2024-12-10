import { booleanPointInPolygon } from '@turf/boolean-point-in-polygon';
import { distance } from '@turf/distance';
import { explode } from '@turf/explode';
import { lineString, point } from '@turf/helpers';
import { nearestPoint } from '@turf/nearest-point';
import { nearestPointOnLine } from '@turf/nearest-point-on-line';
import { type GeometryCollection, type Point, type Position, type Geometry, type Feature } from 'geojson';
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

      // depending on the feature type, we force the popup type to help building the popup content more easily
      setPopupInfos({
        longitude: snapPoint[0],
        latitude: snapPoint[1],
        content: layersWithDynamicContentPopup.includes(hoveredFeature.layer?.id as (typeof layersWithDynamicContentPopup)[number])
          ? {
              type: hoveredFeature.layer?.id,
              properties: hoveredFeature.properties,
            }
          : { [legacyPopupConfigs.find((f) => f.layer === hoveredFeature.layer.id)!.key]: hoveredFeature.properties },
      });
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
      const { distance, snapPoint } = getNearestGeometryPoint(feature.geometry as BasicGeometry, cursorPoint);
      return distance < closest.distance
        ? {
            distance,
            snapPoint,
            feature,
          }
        : closest;
    },
    {
      feature: null as unknown as MapGeoJSONFeature,
      snapPoint: null as unknown as Position,
      distance: Infinity,
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
