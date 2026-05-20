import { type RefObject, useEffect, useRef, useState } from 'react';

import { notify } from '@/modules/notification';
import trpc from '@/modules/trpc/client';
import type { HeatNetworksResponse } from '@/types/HeatNetworksResponse';
import cx from '@/utils/cx';
import type { DeepPartial } from '@/utils/typescript';

import type { InitialView } from '../../shared/types';
import { MapConfigProvider } from '../config/MapConfigProvider';
import type { MapConfiguration } from '../config/map-configuration';
import { useMapConfig } from '../config/useMapConfig';
import { MapMarker } from '../interactions/MapMarker';
import { allLayers } from '../layers/all-layers';
import { LegendDrawer } from '../legend/LegendDrawer';
import { MapCanvas } from '../MapCanvas';
import { AddressSearchInput, type AddressSelection } from '../search/AddressSearchInput';
import { MapSearchInput, type MapSearchResult } from '../search/MapSearchInput';
import type { MapCanvasController } from './controller';
import { useMapInstance } from './MapCanvasContext';

const LEGEND_DRAWER_WIDTH_PX = 350;

/**
 * Legend behaviour:
 * - `false` (default) → no drawer mounted.
 * - `'hidden'` → toggle button visible, drawer collapsed at mount.
 * - `'auto'` → drawer open at mount on viewports ≥ 768px, collapsed otherwise.
 *
 * Drawer width adapts to the container width via Tailwind container queries:
 * full-width on narrow containers (the drawer blankets the map), `w-80` from
 * `@xl` (576px) up — at which point the search overlay slides aside instead
 * of being hidden beneath the drawer.
 */
type LegendMode = false | 'hidden' | 'auto';

const LEGEND_AUTO_OPEN_VIEWPORT_PX = 768;

/**
 * Search overlay mode (mutually exclusive):
 * - `'none'` (default) → no overlay.
 * - `'network'` → combined address + heating-network input that centers the
 *   map on selection (`flyTo` address / `fitBounds` network bbox).
 * - `'eligibility'` → address input that runs an eligibility tRPC query,
 *   drops a colored marker (green = eligible, grey = not) and keeps a local
 *   history of tested addresses.
 */
type SearchMode = 'none' | 'network' | 'eligibility';

type TestedAddress = AddressSelection & {
  id: string;
  eligibility: HeatNetworksResponse;
};

export type MapProps = {
  /**
   * Initial map configuration. `Map` mounts its own `MapConfigProvider` from
   * this partial — runtime mutations (toggles from the legend) live in the
   * provider's reducer. Changing this prop after mount has no effect.
   */
  config: DeepPartial<MapConfiguration>;
  initialView?: InitialView;
  /**
   * When `false`: pan/zoom/touch disabled, controls not mounted, click/hover
   * popups disabled. Attribution still renders. Defaults to `true`.
   */
  interactive?: boolean;
  /** Optional ref for outside-the-tree imperative access (`flyTo`, `fitBounds`). */
  mapRef?: RefObject<MapCanvasController | null>;
  /** Drawer-style legend panel. See `LegendMode`. */
  legend?: LegendMode;
  /** Floating search overlay. See `SearchMode`. */
  search?: SearchMode;
  /** Placeholder for the search overlay's input. */
  searchPlaceholder?: string;
  className?: string;
  /** Optional JSX overlays inside the map (e.g. custom `<MapMarker>`). */
  children?: React.ReactNode;
};

/**
 * High-level map component. Wraps `<MapCanvas>` with:
 * - an internal `<MapConfigProvider>` seeded from `config` (initial config),
 * - the full V1-equivalent layer set hardcoded — `config.<feature>.show`
 *   decides what actually renders,
 * - an optional left-side legend drawer (`legend`),
 * - an optional floating search overlay (`search`: network or eligibility).
 *
 * For mini-maps / embeds with no provider, no legend and no search, use
 * `<MapCanvas>` directly with an explicit `config` prop.
 */
export function Map({ config, ...rest }: MapProps) {
  return (
    <MapConfigProvider partial={config}>
      <MapImplInner {...rest} />
    </MapConfigProvider>
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
  // Single ref drives both the canvas and the search handlers. Forwarded
  // to the consumer's ref when provided (avoids two refs racing).
  const effectiveRef = externalMapRef ?? internalRef;

  const trpcUtils = trpc.useUtils();
  const [history, setHistory] = useState<TestedAddress[]>([]);
  // Drawer state lives here so the search overlay can adapt its position
  // when the drawer expands (see `searchClassName` below).
  const [legendOpen, setLegendOpen] = useState(() => {
    if (legend !== 'auto') return false;
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= LEGEND_AUTO_OPEN_VIEWPORT_PX;
  });

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

  // Search overlay positioning. Default position is `left-3 max-w-…`.
  // When the legend drawer is open AND the container is wide enough to fit
  // the 350px drawer + 320px input side-by-side (`@xl` ≈ 576px), the input
  // slides next to the drawer. Below `@xl`, the drawer takes the full width
  // and covers the input — that's the intended "legend over map" mode for
  // small viewports / iframes.
  const searchClassName = cx(
    'absolute top-3 z-10 w-80 transition-[left,max-width] duration-200',
    'left-3 max-w-[calc(100%-1.5rem)]',
    legendOpen && '@xl:left-[362px] @xl:max-w-[calc(100%-23.5rem)]'
  );

  // Map controls anchored to the left edge (`.maplibregl-ctrl-bottom-left`,
  // `.maplibregl-ctrl-top-left`) need to slide right with the drawer on `@xl+`
  // containers, otherwise they sit beneath it. Below `@xl` the drawer covers
  // the full width so they're hidden behind it — no shift needed.
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
        {legend && <LegendPaddingSync open={legendOpen} />}
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

      {legend && <LegendDrawer open={legendOpen} onOpenChange={setLegendOpen} />}

      {search === 'network' && (
        <MapSearchInput onSelect={handleNetworkSelect} placeholder={searchPlaceholder} className={searchClassName} />
      )}
      {search === 'eligibility' && (
        <AddressSearchInput onSelect={handleEligibilitySelect} placeholder={searchPlaceholder} className={searchClassName} />
      )}
    </div>
  );
}

/**
 * Mirrors the legend drawer's open state into MapLibre's viewport padding so
 * `flyTo` / `fitBounds` (and any user-triggered movement) center on the
 * visible part of the map, not behind the drawer. Mounted as a child of
 * `<MapCanvas>` to have access to the map instance via `useMapInstance`.
 */
function LegendPaddingSync({ open }: { open: boolean }) {
  const map = useMapInstance();
  useEffect(() => {
    map.setPadding({ bottom: 0, left: open ? LEGEND_DRAWER_WIDTH_PX : 0, right: 0, top: 0 });
  }, [map, open]);
  return null;
}

export type { MapCanvasController };
