import maplibregl from 'maplibre-gl';
import { type RefObject, useEffect, useMemo, useRef, useState } from 'react';

import type { MapConfiguration } from '@/components/Map/map-configuration';
import cx from '@/utils/cx';

import { defaultCenter, defaultMaxZoom, defaultMinZoom, defaultZoom, osmStyle } from '../shared/config';
import type { InitialView } from '../shared/types';
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
  /**
   * When `false`, the map is static: pan/zoom/touch is disabled, controls
   * (navigation, scale, geolocate, style switcher) aren't mounted, and
   * click/hover popups are disabled. Attribution still renders for license
   * compliance. Defaults to `true`.
   */
  interactive?: boolean;
  /**
   * V1-style layer specs. When provided together with `config`, sources/layers
   * are mounted once the style is loaded, kept in sync via per-layer diff, and
   * become click/hover-able when `interactive` is `true`.
   */
  layers?: readonly MapSourceLayersSpecification[];
  /** Page-level `MapConfiguration` driving each spec's `isVisible(config)` / `filter(config)`. */
  config?: MapConfiguration;
  /**
   * Optional ref populated with the imperative `MapCanvasController` once the map mounts.
   * Use it from outside the canvas subtree to call `flyTo`, `fitBounds`, etc.
   */
  mapRef?: RefObject<MapCanvasController | null>;
  children?: React.ReactNode;
};

/**
 * Core map component. Creates a single MapLibre instance for the component
 * lifetime, mounts the default controls when `interactive`, drives layer
 * setup + interactions via dedicated child components, and exposes the
 * controller via context and the optional `mapRef` prop.
 */
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

  // Create the MapLibre instance exactly once per component lifetime. The
  // deferred-cleanup pattern (setTimeout 0) cancels the disposal when React
  // 18 strict-mode does an immediate re-mount, so we never tear down a map
  // we're about to keep using.
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

  // Flip `mapReady` once the base style is loaded AND all icon symbols are
  // registered into the MapLibre style. Downstream hooks (layer setup,
  // interactions) gate on this so they never touch an uninitialised style and
  // never render a layer whose icon hasn't been loaded yet (which would log a
  // MapLibre warning and miss the marker visually).
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

  // Keep the canvas sized to its container. MapLibre needs an explicit `resize()`
  // call on container changes (CSS-only resizes don't fire window 'resize').
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

  // Forward the imperative controller to the optional external ref, so the
  // parent can call `flyTo` / `fitBounds` from outside the canvas subtree.
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
    <div className={cx('relative h-full w-full overflow-hidden bg-(--background-alt-grey)', className)}>
      <div ref={containerRef} className="absolute inset-0" />
      {contextValue && (
        <MapCanvasContext.Provider value={contextValue}>
          <AttributionControl />
          {interactive && (
            <>
              <NavigationControl />
              <GeolocateControl />
              <ScaleControl />
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
