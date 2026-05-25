import maplibregl from 'maplibre-gl';
import { type RefObject, useEffect, useMemo, useRef, useState } from 'react';

import cx from '@/utils/cx';

import { defaultCenter, defaultMaxZoom, defaultMinZoom, defaultZoom, osmStyle } from '../shared/config';
import type { InitialView } from '../shared/types';
import type { MapConfiguration } from './config/map-configuration';
import { AttributionControl } from './controls/AttributionControl';
import { GeolocateControl } from './controls/GeolocateControl';
import { NavigationControl } from './controls/NavigationControl';
import { ScaleControl } from './controls/ScaleControl';
import { StyleSwitcher } from './controls/StyleSwitcher';
import type { MapSourceLayersSpecification } from './core/common';
import { createMapCanvasController, type MapCanvasController } from './core/controller';
import { layerSymbolsImagesURLs } from './core/layer-symbols';
import { MapCanvasContext, type UserResources } from './core/MapCanvasContext';
import { MapInteractions } from './interactions/MapInteractions';
import { ConfiguredLayers } from './layers/ConfiguredLayers';

import 'maplibre-gl/dist/maplibre-gl.css';

type MapCanvasProps = {
  initialView?: InitialView;
  className?: string;
  /** When `false`: pan/zoom/touch disabled, controls + popups skipped (attribution still renders). */
  interactive?: boolean;
  /** Layer specs auto-mounted + diffed against `config`. */
  layers?: readonly MapSourceLayersSpecification[];
  /** Drives each spec's `isVisible(config)` / `filter(config)`. */
  config?: MapConfiguration;
  /** Imperative access from outside the canvas subtree (`flyTo`, `fitBounds`). */
  mapRef?: RefObject<MapCanvasController | null>;
  children?: React.ReactNode;
};

/** Single MapLibre instance + controls + layers + interactions. */
export function MapCanvas({
  initialView,
  className,
  interactive = true,
  layers,
  config,
  mapRef: externalMapRef,
  children,
}: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const cleanupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialConfigRef = useRef({ initialView, interactive });
  const userResourcesRef = useRef<UserResources>({ layers: new Set(), sources: new Set() });
  const [map, setMap] = useState<maplibregl.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Create the MapLibre instance once per lifetime. Deferred cleanup
  // (`setTimeout 0`) survives React 18 strict-mode's mount/unmount/mount cycle.
  useEffect(() => {
    if (cleanupTimerRef.current) {
      clearTimeout(cleanupTimerRef.current);
      cleanupTimerRef.current = null;
    }

    if (mapInstanceRef.current) {
      setMap(mapInstanceRef.current);
      return;
    }

    const container = containerRef.current;
    if (!container) {
      return;
    }

    const { initialView, interactive } = initialConfigRef.current;
    const hasCenter = initialView && 'center' in initialView;

    const instance = new maplibregl.Map({
      attributionControl: false,
      center: hasCenter ? initialView.center : defaultCenter,
      container,
      interactive,
      maxZoom: defaultMaxZoom,
      minZoom: defaultMinZoom,
      style: osmStyle,
      zoom: hasCenter ? (initialView.zoom ?? defaultZoom) : defaultZoom,
    });

    if (initialView && 'bbox' in initialView) {
      const { bbox } = initialView;
      instance.fitBounds(
        [
          [bbox[0], bbox[1]],
          [bbox[2], bbox[3]],
        ],
        { animate: false, padding: 40 }
      );
    }

    mapInstanceRef.current = instance;
    setMap(instance);

    return () => {
      cleanupTimerRef.current = setTimeout(() => {
        mapInstanceRef.current?.remove();
        mapInstanceRef.current = null;
        cleanupTimerRef.current = null;
        setMap(null);
        setMapReady(false);
      }, 0);
    };
  }, []);

  // `mapReady` flips once the style is loaded AND every icon symbol is
  // registered — downstream hooks gate on it to avoid missing-marker warnings.
  useEffect(() => {
    if (!map) {
      return;
    }
    let cancelled = false;

    const loadSymbols = async () => {
      await Promise.all(
        layerSymbolsImagesURLs.map(async (symbol) => {
          if (map.hasImage(symbol.key)) {
            return;
          }
          try {
            const response = await map.loadImage(symbol.url);
            if (cancelled || map.hasImage(symbol.key)) {
              return;
            }
            map.addImage(symbol.key, response.data, { sdf: 'sdf' in symbol && symbol.sdf });
          } catch (error) {
            console.error(`MapCanvas: failed to load symbol "${symbol.key}"`, error);
          }
        })
      );
    };

    const finish = async () => {
      await loadSymbols();
      if (!cancelled) {
        setMapReady(true);
      }
    };

    if (map.isStyleLoaded()) {
      void finish();
    } else {
      map.once('load', finish);
    }

    return () => {
      cancelled = true;
      map.off('load', finish);
    };
  }, [map]);

  // MapLibre needs an explicit `resize()` on container changes (CSS-only
  // resizes don't fire window 'resize').
  useEffect(() => {
    const container = containerRef.current;
    if (!map || !container) {
      return;
    }
    const observer = new ResizeObserver(() => map.resize());
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);

  const controller = useMemo(() => (map ? createMapCanvasController(map, userResourcesRef.current) : null), [map]);

  // Forward the controller to the optional external ref.
  useEffect(() => {
    if (!externalMapRef) {
      return;
    }
    externalMapRef.current = controller;
    return () => {
      externalMapRef.current = null;
    };
  }, [controller, externalMapRef]);

  const contextValue = useMemo(
    () =>
      map && controller
        ? {
            controller,
            map,
            mapReady,
            userResources: userResourcesRef.current,
          }
        : null,
    [map, controller, mapReady]
  );

  return (
    <div
      className={cx(
        'relative h-full w-full overflow-hidden bg-(--background-alt-grey)',
        // Tighten the compact attribution: MapLibre ships `margin: 10px` on the
        // ⓘ icon, which feels off given the other bottom-right controls already
        // include their own 10px container margin.
        '[&_.maplibregl-ctrl-attrib.maplibregl-compact]:my-1!',
        className
      )}
    >
      <div ref={containerRef} className="absolute inset-0" />
      {contextValue && (
        <MapCanvasContext.Provider value={contextValue}>
          <AttributionControl />
          <ScaleControl />
          {interactive && (
            <>
              <NavigationControl />
              <GeolocateControl />
              <StyleSwitcher />
            </>
          )}
          {layers && config && <ConfiguredLayers layers={layers} config={config} />}
          {interactive && layers && <MapInteractions layers={layers} />}
          {children}
        </MapCanvasContext.Provider>
      )}
    </div>
  );
}
