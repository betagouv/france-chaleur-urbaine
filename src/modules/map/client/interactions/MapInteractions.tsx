import { booleanPointInPolygon } from '@turf/boolean-point-in-polygon';
import { distance } from '@turf/distance';
import { explode } from '@turf/explode';
import { lineString, point } from '@turf/helpers';
import { nearestPoint } from '@turf/nearest-point';
import { nearestPointOnLine } from '@turf/nearest-point-on-line';
import type { Feature, Geometry, GeometryCollection, Point, Position } from 'geojson';
import maplibregl, { type MapGeoJSONFeature, type MapMouseEvent } from 'maplibre-gl';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { useAuthentication } from '@/modules/auth/client/hooks';
import { isDefined } from '@/utils/core';

import { buildPopupStyleHelpers, type MapLayerSpecification, type MapSourceLayersSpecification, type PopupContext } from '../core/common';
import { useMapInstance } from '../core/MapCanvasContext';

const SELECTION_BUFFER_PX = 15;

type SelectableLayer = {
  layerId: string;
  spec: MapLayerSpecification;
};

type PopupState = {
  longitude: number;
  latitude: number;
  content: React.ReactNode;
  offset?: [number, number];
};

type HoveredFeatureRef = {
  id: MapGeoJSONFeature['id'];
  source: string;
  sourceLayer?: string;
};

/**
 * Wires V1-style click / hover handling to the parent `<MapCanvas>`. Mount it
 * conditionally — when it's mounted, interactions are on; when it isn't, none
 * of its hooks run. Returns the popup node (or `null`).
 */
export function MapInteractions({ layers }: { layers: readonly MapSourceLayersSpecification[] }) {
  return useMapInteractions(layers);
}

/**
 * Hook backing `<MapInteractions>`. Derives the list of clickable layers
 * statically from `layers` (every sublayer whose spec doesn't carry
 * `unselectable: true`). On `mousemove`/`click`, queries features within a
 * 15px buffer, picks one via geometry priority (Point > Line > Polygon) with
 * a nearest-distance tie-break via turf, applies `feature-state.hover`, and
 * opens a popup at the snap point.
 */
export function useMapInteractions(layers: readonly MapSourceLayersSpecification[]): React.ReactNode {
  const map = useMapInstance();
  const router = useRouter();
  const { hasRole, isAuthenticated } = useAuthentication();
  const [popup, setPopup] = useState<PopupState | null>(null);
  const popupContainerRef = useRef<HTMLDivElement | null>(null);
  if (!popupContainerRef.current && typeof document !== 'undefined') {
    popupContainerRef.current = document.createElement('div');
  }

  const selectableLayers = useMemo<SelectableLayer[]>(
    () =>
      layers.flatMap((spec) =>
        spec.layers
          .filter(
            (layer): layer is Extract<MapLayerSpecification, { unselectable?: false }> => !(layer as MapLayerSpecification).unselectable
          )
          .map((layer) => ({ layerId: layer.id, spec: layer }))
      ),
    [layers]
  );

  // `useAuthentication()` returns a fresh `hasRole` function on every render,
  // which would invalidate `popupContext` and re-fire the listeners effect on
  // every click (the cleanup calls `clearHover()` → the hover visually drops
  // the moment the popup opens). We stash the context in a ref so the click
  // handler reads the current value at click time without forcing the effect
  // to re-attach.
  const popupContextRef = useRef<PopupContext>({ hasRole, isAuthenticated, pathname: router.pathname });
  popupContextRef.current = { hasRole, isAuthenticated, pathname: router.pathname };

  // Register one mousemove + one click/touchend handler at the map level.
  // Drives the hover feature-state on the closest matching feature and opens
  // the popup state on click. Bails out when nothing is clickable.
  useEffect(() => {
    if (selectableLayers.length === 0) {
      return;
    }

    const hoveredRef: { current: HoveredFeatureRef | null } = { current: null };
    const layerIds = selectableLayers.map((layer) => layer.layerId);

    const queryTop = (event: MapMouseEvent) => {
      const renderedIds = layerIds.filter((id) => map.getLayer(id));
      if (renderedIds.length === 0) {
        return { feature: null as MapGeoJSONFeature | null, snapPoint: null as Position | null };
      }
      return findHoveredFeature(map, event.point.x, event.point.y, renderedIds);
    };

    const clearHover = () => {
      if (!hoveredRef.current) {
        return;
      }
      try {
        map.setFeatureState(hoveredRef.current, { hover: false });
      } catch {
        // source/layer may have been removed; ignore.
      }
      hoveredRef.current = null;
    };

    const onMouseMove = (event: MapMouseEvent) => {
      const { feature } = queryTop(event);
      map.getCanvas().style.cursor = feature ? 'pointer' : '';

      const currentId = hoveredRef.current?.id;
      const nextId = feature?.id;

      if (currentId !== nextId) {
        if (hoveredRef.current) {
          clearHover();
        }
        if (feature && isDefined(feature.id)) {
          hoveredRef.current = {
            id: feature.id,
            source: feature.source,
            sourceLayer: feature.sourceLayer,
          };
          try {
            map.setFeatureState(hoveredRef.current, { hover: true });
          } catch {
            hoveredRef.current = null;
          }
        }
      }
    };

    const onClick = (event: MapMouseEvent) => {
      const { feature, snapPoint } = queryTop(event);
      if (!feature || !snapPoint) {
        return;
      }
      const selected = selectableLayers.find((layer) => layer.layerId === feature.layer.id);
      if (!selected?.spec.popup) {
        return;
      }
      const close = () => setPopup(null);
      const helpers = buildPopupStyleHelpers(close);
      setPopup({
        content: selected.spec.popup(feature.properties ?? {}, helpers, popupContextRef.current),
        latitude: snapPoint[1],
        longitude: snapPoint[0],
        offset: selected.spec.popupOffset,
      });
    };

    // No `mouseleave` handler on purpose: when a popup opens, the cursor moves
    // over the popup DOM and leaves the canvas — clearing hover here would kill
    // the visual feedback on the clicked feature while the user is reading the
    // popup. The hover state is naturally cleared by the next `mousemove` over
    // a feature-less area on the canvas.
    map.on('mousemove', onMouseMove);
    map.on('click', onClick);
    map.on('touchend', onClick);

    return () => {
      map.off('mousemove', onMouseMove);
      map.off('click', onClick);
      map.off('touchend', onClick);
      clearHover();
      map.getCanvas().style.cursor = '';
    };
  }, [map, selectableLayers]);

  // Open/close the native maplibregl.Popup whenever `popup` state changes.
  // The React content is portal'd into the popup's DOM container below.
  useEffect(() => {
    if (!popup || !popupContainerRef.current) {
      return;
    }
    const instance = new maplibregl.Popup({
      closeButton: true,
      closeOnClick: true,
      maxWidth: '500px',
      offset: popup.offset,
    })
      .setLngLat([popup.longitude, popup.latitude])
      .setDOMContent(popupContainerRef.current)
      .addTo(map);
    const onClose = () => setPopup(null);
    instance.on('close', onClose);
    return () => {
      instance.off('close', onClose);
      instance.remove();
    };
  }, [map, popup]);

  if (!popup || !popupContainerRef.current) {
    return null;
  }
  return createPortal(popup.content, popupContainerRef.current);
}

function findHoveredFeature(
  map: maplibregl.Map,
  cursorX: number,
  cursorY: number,
  layerIds: string[]
): { feature: MapGeoJSONFeature; snapPoint: Position } | { feature: null; snapPoint: null } {
  const hoveredFeatures = map.queryRenderedFeatures(
    [
      [cursorX - SELECTION_BUFFER_PX, cursorY - SELECTION_BUFFER_PX],
      [cursorX + SELECTION_BUFFER_PX, cursorY + SELECTION_BUFFER_PX],
    ],
    { layers: layerIds }
  );

  if (hoveredFeatures.length === 0) {
    return { feature: null, snapPoint: null };
  }

  const cursorPoint = point(map.unproject([cursorX, cursorY]).toArray());

  const { feature, snapPoint } = hoveredFeatures.reduce(
    (closest, candidate) => {
      const priority = hoverPriority[(candidate.geometry as BasicGeometry).type];
      const { distance, snapPoint } = getNearestGeometryPoint(candidate.geometry as BasicGeometry, cursorPoint);
      return priority < closest.priority || (priority === closest.priority && distance < closest.distance)
        ? { distance, feature: candidate, priority, snapPoint }
        : closest;
    },
    {
      distance: Number.POSITIVE_INFINITY,
      feature: null as unknown as MapGeoJSONFeature,
      priority: Number.POSITIVE_INFINITY,
      snapPoint: null as unknown as Position,
    }
  );
  return { feature, snapPoint };
}

type BasicGeometry = Exclude<Geometry, GeometryCollection>;

type ClosestPointResult = {
  snapPoint: Position;
  distance: number;
};

type GeometryNearestPointHandlers = {
  [K in BasicGeometry['type']]: (geometry: Extract<BasicGeometry, { type: K }>, point: Feature<Point>) => ClosestPointResult;
};

const geometryNearestPointHandlers: GeometryNearestPointHandlers = {
  LineString: (geometry, p) => {
    const snap = nearestPointOnLine(geometry, p, { units: 'meters' });
    return { distance: snap.properties.dist, snapPoint: snap.geometry.coordinates };
  },
  MultiLineString: (geometry, p) => {
    const snap = nearestPointOnLine(geometry, p, { units: 'meters' });
    return { distance: snap.properties.dist, snapPoint: snap.geometry.coordinates };
  },
  MultiPoint: (geometry, p) => {
    const nearest = nearestPoint(p, explode(geometry), { units: 'meters' });
    return { distance: nearest.properties.distanceToPoint, snapPoint: nearest.geometry.coordinates };
  },
  MultiPolygon: (geometry, p) => {
    if (booleanPointInPolygon(p, geometry)) {
      return { distance: 0, snapPoint: p.geometry.coordinates };
    }
    return geometry.coordinates.reduce<ClosestPointResult>(
      (closest, polygonCoords) => {
        const closestForPolygon = polygonCoords.reduce<ClosestPointResult>(
          (acc, ring) => {
            const snap = nearestPointOnLine(lineString(ring), p, { units: 'meters' });
            return snap.properties.dist < acc.distance ? { distance: snap.properties.dist, snapPoint: snap.geometry.coordinates } : acc;
          },
          { distance: Number.POSITIVE_INFINITY, snapPoint: [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY] }
        );
        return closestForPolygon.distance < closest.distance ? closestForPolygon : closest;
      },
      { distance: Number.POSITIVE_INFINITY, snapPoint: [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY] }
    );
  },
  Point: (geometry, p) => ({
    distance: distance(p, geometry, { units: 'meters' }),
    snapPoint: geometry.coordinates,
  }),
  Polygon: (geometry, p) => {
    if (booleanPointInPolygon(p, geometry)) {
      return { distance: 0, snapPoint: p.geometry.coordinates };
    }
    return geometry.coordinates.reduce<ClosestPointResult>(
      (acc, ring) => {
        const snap = nearestPointOnLine(lineString(ring), p, { units: 'meters' });
        return snap.properties.dist < acc.distance ? { distance: snap.properties.dist, snapPoint: snap.geometry.coordinates } : acc;
      },
      { distance: Number.POSITIVE_INFINITY, snapPoint: [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY] }
    );
  },
};

function getNearestGeometryPoint(geometry: BasicGeometry, p: Feature<Point>): ClosestPointResult {
  return geometryNearestPointHandlers[geometry.type](geometry as any, p);
}

const hoverPriority: Record<BasicGeometry['type'], number> = {
  LineString: 2,
  MultiLineString: 2,
  MultiPoint: 1,
  MultiPolygon: 3,
  Point: 1,
  Polygon: 3,
};
