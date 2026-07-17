import { booleanPointInPolygon } from '@turf/boolean-point-in-polygon';
import { distance } from '@turf/distance';
import { explode } from '@turf/explode';
import { lineString, point } from '@turf/helpers';
import { nearestPoint } from '@turf/nearest-point';
import { nearestPointOnLine } from '@turf/nearest-point-on-line';
import type { Feature, Geometry, GeometryCollection, Point, Position } from 'geojson';
import { useAtomValue } from 'jotai';
import maplibregl, { type MapGeoJSONFeature, type MapMouseEvent } from 'maplibre-gl';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { trackPostHogEvent } from '@/modules/analytics/client';
import { useAuthentication } from '@/modules/auth/client/hooks';
import { isDefined } from '@/utils/core';
import cx from '@/utils/cx';

import { buildPopupStyleHelpers, type MapLayerSpecification, type MapSourceLayersSpecification, type PopupContext } from '../core/common';
import { useMapInstance } from '../core/MapCanvasContext';
import { isDrawingAtom } from './atoms';
import { featureClickSubscribersAtom, mapClickCaptureCountAtom } from './clickHandlers';

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
  maxWidth: number;
  maxHeight: number;
  compact: boolean;
};

type HoveredFeatureRef = {
  id: MapGeoJSONFeature['id'];
  source: string;
  sourceLayer?: string;
};

/** Click / hover handling on the parent `<MapCanvas>`. Paused while `isDrawing`. */
export function MapInteractions({ layers }: { layers: readonly MapSourceLayersSpecification[] }) {
  return useMapInteractions(layers);
}

/**
 * Hover/click handlers with 15px buffer, geometry priority (Point > Line >
 * Polygon) and a turf-snapped popup anchor.
 */
export function useMapInteractions(layers: readonly MapSourceLayersSpecification[]): React.ReactNode {
  const map = useMapInstance();
  const router = useRouter();
  const { hasRole, isAuthenticated } = useAuthentication();
  const isDrawing = useAtomValue(isDrawingAtom);
  const [popup, setPopup] = useState<PopupState | null>(null);
  const popupContainerRef = useRef<HTMLDivElement | null>(null);
  if (!popupContainerRef.current && typeof document !== 'undefined') {
    popupContainerRef.current = document.createElement('div');
  }

  // True while the previous run was in drawing mode; gates the post-draw delay.
  const wasDrawingRef = useRef(false);

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

  // Stashed in a ref because `useAuthentication()` returns a fresh `hasRole`
  // function each render — would otherwise re-fire the listeners effect.
  const popupContextRef = useRef<PopupContext>({ hasRole, isAuthenticated, pathname: router.pathname });
  popupContextRef.current = { hasRole, isAuthenticated, pathname: router.pathname };

  // Base-click subscribers (see clickHandlers.ts). Read into a ref so registering one never
  // re-attaches the listener below; the click handler reads the latest set.
  const subscribers = useAtomValue(featureClickSubscribersAtom);
  const subscribersRef = useRef(subscribers);
  subscribersRef.current = subscribers;

  // A tool may "capture" the click (building selector, …): base interactions pause, like drawing.
  const isClickCaptured = useAtomValue(mapClickCaptureCountAtom) > 0;

  // Register mousemove + click/touchend handlers on the map.
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

    // Hover work (queryRenderedFeatures + turf snap) is heavy. mousemove can fire far faster than the
    // display refreshes, so coalesce bursts into at most one run per animation frame — only the latest
    // cursor position matters for hover. Keeps the main thread free without changing behaviour.
    let moveRafId: number | null = null;
    let pendingMove: MapMouseEvent | null = null;

    const processMove = () => {
      moveRafId = null;
      const event = pendingMove;
      pendingMove = null;
      if (!event) {
        return;
      }
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

    const onMouseMove = (event: MapMouseEvent) => {
      pendingMove = event;
      if (moveRafId === null) {
        moveRafId = requestAnimationFrame(processMove);
      }
    };

    const onClick = (event: MapMouseEvent) => {
      const { feature, snapPoint } = queryTop(event);
      if (!feature || !snapPoint) {
        setPopup(null);
        return;
      }
      // Notify base-click subscribers for this feature's source (e.g. demand selection), then open the popup.
      for (const ref of subscribersRef.current) {
        if (ref.current.source === feature.source) {
          ref.current.onClick(feature, snapPoint);
        }
      }
      const selected = selectableLayers.find((layer) => layer.layerId === feature.layer.id);
      if (!selected?.spec.popup) {
        setPopup(null);
        return;
      }
      trackPostHogEvent('map:feature_click', {
        feature_id: feature.properties?.id_fcu ?? feature.id?.toString(),
        feature_type: feature.source,
      });
      const close = () => setPopup(null);
      const helpers = buildPopupStyleHelpers(close);
      const mapContainer = map.getContainer();

      const popupMargin = 24;
      const arrowAndOffset = 20;

      // Position du clic dans la map, en pixels.
      const point = map.project([snapPoint[0], snapPoint[1]]);

      // La popup s'ouvre principalement au-dessus du point.
      // On réserve une marge pour éviter qu'elle touche les bords.
      const availableHeightAbove = point.y - popupMargin - arrowAndOffset;

      // Si le point est très haut dans la map, on laisse quand même une hauteur
      // minimale et MapLibre choisira une autre direction si nécessaire.
      const maxHeight = Math.min(500, Math.max(120, availableHeightAbove));

      const maxWidth = Math.min(500, Math.max(220, mapContainer.clientWidth - popupMargin * 2));
      const compact = maxHeight < 260 || maxWidth < 320;
      setPopup({
        compact,
        content: selected.spec.popup(feature.properties ?? {}, helpers, popupContextRef.current),
        latitude: snapPoint[1],
        longitude: snapPoint[0],
        maxHeight,
        maxWidth,
        offset: selected.spec.popupOffset,
      });
    };

    // No `mouseleave`: would kill the hover state when the cursor moves over
    // the popup DOM. Hover clears naturally on the next feature-less mousemove.
    // Paused while drawing OR while a tool captures the click (building selector, …) —
    // base layers don't open popups / hover meanwhile.
    if (isDrawing || isClickCaptured) {
      if (isDrawing) {
        wasDrawingRef.current = true;
      }
      clearHover();
      map.getCanvas().style.cursor = '';
      return;
    }

    // Defer re-attach after a drawing ended: the trailing dblclick click would
    // otherwise open a popup on the feature underneath.
    const reactivateDelayMs = wasDrawingRef.current ? 300 : 0;
    wasDrawingRef.current = false;
    let attached = false;
    const timeoutId = window.setTimeout(() => {
      map.on('mousemove', onMouseMove);
      map.on('click', onClick);
      map.on('touchend', onClick);
      attached = true;
    }, reactivateDelayMs);

    return () => {
      window.clearTimeout(timeoutId);
      if (moveRafId !== null) {
        cancelAnimationFrame(moveRafId);
      }
      if (attached) {
        map.off('mousemove', onMouseMove);
        map.off('click', onClick);
        map.off('touchend', onClick);
      }
      clearHover();
      map.getCanvas().style.cursor = '';
    };
  }, [map, selectableLayers, isDrawing, isClickCaptured]);

  // Open/close the maplibregl.Popup whenever the `popup` state changes.
  useEffect(() => {
    if (!popup || !popupContainerRef.current) {
      return;
    }

    const container = popupContainerRef.current;

    container.className = 'map-popup-container';
    container.style.setProperty('--popup-max-height', `${popup.maxHeight}px`);
    container.style.setProperty('--popup-max-width', `${popup.maxWidth}px`);

    const instance = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      maxWidth: `${popup.maxWidth}px`,
      offset: popup.offset,
      padding: map.getPadding(),
    })
      .setLngLat([popup.longitude, popup.latitude])
      .setDOMContent(container)
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
  return createPortal(
    <div
      className={cx(
        'h-fit overflow-auto',
        popup.compact && [
          'text-xs',
          '[&_.fr-h6]:text-xs!',
          '[&_.fr-h6]:leading-tight!',
          '[&_.fr-accordion__btn]:text-xs',
          '[&_.fr-btn]:text-xs',
          '[&_.fr-btn]:min-h-8',
          '[&_.fr-btn]:py-1',
          '[&_.fr-btn]:px-1',
          '[&_.fr-accordion__title]:text-xs',
          '[&_.grid]:gap-x-1',
          '[&_.grid]:gap-y-0.5',
        ]
      )}
      style={{
        maxHeight: `${popup.maxHeight}px`,
        maxWidth: `${popup.maxWidth}px`,
      }}
    >
      {popup.content}
    </div>,
    popupContainerRef.current
  );
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

  // Geometry priority always beats distance, so only candidates at the best priority present can win.
  // Run the costly turf nearest-point math on those alone — skipping e.g. polygons under a line/point
  // entirely. Same result as scoring every candidate.
  const bestPriority = hoveredFeatures.reduce(
    (min, candidate) => Math.min(min, hoverPriority[(candidate.geometry as BasicGeometry).type]),
    Number.POSITIVE_INFINITY
  );

  const cursorPoint = point(map.unproject([cursorX, cursorY]).toArray());

  const closest = hoveredFeatures
    .filter((candidate) => hoverPriority[(candidate.geometry as BasicGeometry).type] === bestPriority)
    .reduce<{ feature: MapGeoJSONFeature; snapPoint: Position; distance: number } | null>((best, candidate) => {
      const nearest = getNearestGeometryPoint(candidate.geometry as BasicGeometry, cursorPoint);
      return !best || nearest.distance < best.distance
        ? { distance: nearest.distance, feature: candidate, snapPoint: nearest.snapPoint }
        : best;
    }, null);

  return closest ? { feature: closest.feature, snapPoint: closest.snapPoint } : { feature: null, snapPoint: null };
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
