import { useAtomValue } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';
import { type RefObject, useEffect, useMemo, useRef, useState } from 'react';

import { notify } from '@/modules/notification';
import trpc from '@/modules/trpc/client';
import type { HeatNetworksResponse } from '@/types/HeatNetworksResponse';
import cx from '@/utils/cx';
import type { DeepPartial } from '@/utils/typescript';

import type { InitialView } from '../../shared/types';
import type { MapConfiguration } from '../config/map-configuration';
import { useMapConfig } from '../config/useMapConfig';
import { MapDrawHost } from '../interactions/MapDrawHost';
import { MapInstanceSync } from '../interactions/MapInstanceSync';
import { MapMarker } from '../interactions/MapMarker';
import { allLayers } from '../layers/all-layers';
import { legendOpenAtom } from '../legend/atoms';
import { LegendDrawer } from '../legend/LegendDrawer';
import { MapCanvas } from '../MapCanvas';
import { MapStoreProvider } from '../MapStoreProvider';
import { AddressSearchInput, type AddressSelection } from '../search/AddressSearchInput';
import { MapSearchInput, type MapSearchResult } from '../search/MapSearchInput';
import type { MapCanvasController } from './controller';
import { useMapInstance } from './MapCanvasContext';

const LEGEND_DRAWER_WIDTH_PX = 350;
const LEGEND_AUTO_OPEN_VIEWPORT_PX = 768;

/**
 * Legend drawer behaviour:
 * - `false` → no drawer mounted.
 * - `'hidden'` → toggle button visible, drawer collapsed at mount.
 * - `'auto'` → drawer open at mount on viewports ≥ 768px.
 */
type LegendMode = false | 'hidden' | 'auto';

/** Floating search overlay (mutually exclusive). */
type SearchMode = 'none' | 'network' | 'eligibility';

type TestedAddress = AddressSelection & {
  id: string;
  eligibility: HeatNetworksResponse;
};

export type MapProps = {
  /** Initial map configuration. Changing this prop after mount has no effect. */
  config: DeepPartial<MapConfiguration>;
  initialView?: InitialView;
  /** Disables pan/zoom/touch and built-in controls (attribution still renders). */
  interactive?: boolean;
  /** Imperative access from outside the subtree (`flyTo`, `fitBounds`). */
  mapRef?: RefObject<MapCanvasController | null>;
  legend?: LegendMode;
  search?: SearchMode;
  /** Placeholder for the search overlay's input. */
  searchPlaceholder?: string;
  className?: string;
  /** JSX overlays inside the canvas (e.g. custom `<MapMarker>`). */
  children?: React.ReactNode;
};

/**
 * High-level map. Mounts a per-instance Jotai store via `<MapStoreProvider>`,
 * the built-in layer set, plus optional legend drawer and search overlay.
 *
 * For mini-maps with no legend / no search, use `<MapCanvas>` directly.
 */
export function Map({ config, ...rest }: MapProps) {
  return (
    <MapStoreProvider partial={config}>
      <MapImplInner {...rest} />
    </MapStoreProvider>
  );
}

function MapImplInner({
  initialView,
  interactive = true,
  mapRef: externalMapRef,
  legend = false,
  search = 'none',
  searchPlaceholder,
  className,
  children,
}: Omit<MapProps, 'config'>) {
  const { config } = useMapConfig();
  const internalRef = useRef<MapCanvasController | null>(null);
  const effectiveRef = externalMapRef ?? internalRef;

  // Seed legendOpen synchronously (before children render) to avoid a flash.
  const initialLegendOpen = useMemo(() => {
    if (legend !== 'auto') return false;
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= LEGEND_AUTO_OPEN_VIEWPORT_PX;
  }, [legend]);
  useHydrateAtoms([[legendOpenAtom, initialLegendOpen]]);
  const legendOpen = useAtomValue(legendOpenAtom);

  const trpcUtils = trpc.useUtils();
  const [history, setHistory] = useState<TestedAddress[]>([]);

  const handleNetworkSelect = (result: MapSearchResult) => {
    const controller = effectiveRef.current;
    if (!controller) return;
    if (result.kind === 'network') {
      controller.fitBounds(result.bbox, { maxZoom: 14, padding: 50 });
      return;
    }
    controller.flyTo(result.coordinates, { zoom: result.isCity ? 13 : 16 });
  };

  const handleEligibilitySelect = async (selection: AddressSelection) => {
    const controller = effectiveRef.current;
    try {
      const [lng, lat] = selection.coordinates;
      const eligibility = selection.isCity
        ? await trpcUtils.client.reseaux.cityNetwork.query({ city: selection.feature.properties.city })
        : await trpcUtils.client.reseaux.eligibilityStatus.query({ lat, lon: lng });
      controller?.flyTo(selection.coordinates, { zoom: selection.isCity ? 13 : 16 });
      const id = `${lng.toFixed(7)},${lat.toFixed(7)}`;
      setHistory((prev) => [{ ...selection, eligibility, id }, ...prev.filter((entry) => entry.id !== id)]);
    } catch {
      notify('error', 'Impossible de tester cette adresse. Réessayez ou contactez le support.');
    }
  };

  // Below `@xl` the drawer takes the full width and covers everything; above
  // it, the search input and left-anchored controls slide to its right.
  const searchClassName = cx(
    'absolute top-3 z-10 w-80 transition-[left,max-width] duration-200',
    'left-3 max-w-[calc(100%-1.5rem)]',
    legendOpen && '@xl:left-[362px] @xl:max-w-[calc(100%-23.5rem)]'
  );

  const wrapperClass = cx(
    '@container relative h-full w-full',
    '[&_.maplibregl-ctrl-bottom-left]:transition-[margin-left] [&_.maplibregl-ctrl-bottom-left]:duration-200',
    '[&_.maplibregl-ctrl-top-left]:transition-[margin-left] [&_.maplibregl-ctrl-top-left]:duration-200',
    legendOpen && '@xl:[&_.maplibregl-ctrl-bottom-left]:ml-[350px] @xl:[&_.maplibregl-ctrl-top-left]:ml-[350px]',
    className
  );

  return (
    <div className={wrapperClass}>
      <MapCanvas mapRef={effectiveRef} initialView={initialView} interactive={interactive} layers={allLayers} config={config}>
        <MapInstanceSync />
        {legend && <MapDrawHost />}
        {legend && <LegendPaddingSync />}
        {search === 'eligibility' &&
          history.map((entry) => (
            <MapMarker
              key={entry.id}
              longitude={entry.coordinates[0]}
              latitude={entry.coordinates[1]}
              color={entry.eligibility.isEligible ? '#0D543F' : '#aaaaaa'}
            />
          ))}
        {children}
      </MapCanvas>

      {legend && <LegendDrawer />}

      {search === 'network' && (
        <MapSearchInput onSelect={handleNetworkSelect} placeholder={searchPlaceholder} className={searchClassName} />
      )}
      {search === 'eligibility' && (
        <AddressSearchInput onSelect={handleEligibilitySelect} placeholder={searchPlaceholder} className={searchClassName} />
      )}
    </div>
  );
}

/** Reflects the drawer width into MapLibre's viewport padding so cadrages exclude it. */
function LegendPaddingSync() {
  const map = useMapInstance();
  const open = useAtomValue(legendOpenAtom);
  useEffect(() => {
    map.setPadding({ bottom: 0, left: open ? LEGEND_DRAWER_WIDTH_PX : 0, right: 0, top: 0 });
  }, [map, open]);
  return null;
}

export type { MapCanvasController };
