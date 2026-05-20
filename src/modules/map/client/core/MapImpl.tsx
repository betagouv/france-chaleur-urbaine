import { useLocalStorageValue } from '@react-hookz/web';
import { useAtomValue } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';
import { type CSSProperties, type RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import useContactFormFCU from '@/hooks/useContactFormFCU';
import { trackPostHogEvent } from '@/modules/analytics/client';
import { notify } from '@/modules/notification';
import trpc from '@/modules/trpc/client';
import type { HeatNetworksResponse } from '@/types/HeatNetworksResponse';
import type { Point } from '@/types/Point';
import type { StoredAddress } from '@/types/StoredAddress';
import cx from '@/utils/cx';
import type { DeepPartial } from '@/utils/typescript';

import type { BBox, InitialView } from '../../shared/types';
import type { MapConfiguration } from '../config/map-configuration';
import { useMapConfig } from '../config/useMapConfig';
import { MapContextMenu } from '../interactions/MapContextMenu';
import { MapDrawHost } from '../interactions/MapDrawHost';
import { MapInstanceSync } from '../interactions/MapInstanceSync';
import { MapMarker } from '../interactions/MapMarker';
import { allLayers } from '../layers/all-layers';
import { legendOpenAtom } from '../legend/atoms';
import { LegendDrawer } from '../legend/LegendDrawer';
import { MapCanvas } from '../MapCanvas';
import { MapStoreProvider } from '../MapStoreProvider';
import { AddressSearchInput, type AddressSelection } from '../search/AddressSearchInput';
import { EligibilityPopup } from '../search/EligibilityPopup';
import { EligibilityResultsPanel } from '../search/EligibilityResultsPanel';
import { MapSearchInput, type MapSearchResult } from '../search/MapSearchInput';
import type { MapCanvasController } from './controller';
import { useMapInstance } from './MapCanvasContext';

/**
 * Single source of truth for the open legend drawer width (`@xl` and up). Used
 * by JS (`setPadding`) and exposed as the `--legend-drawer-width` CSS var on the
 * map wrapper so the drawer, its toggle, the controls margin and the search
 * overlay all stay in sync.
 */
const LEGEND_DRAWER_WIDTH_PX = 345;
const LEGEND_AUTO_OPEN_VIEWPORT_PX = 768;

/** Style exposing the drawer width as a CSS var on the map wrapper. */
const mapWrapperStyle = { '--legend-drawer-width': `${LEGEND_DRAWER_WIDTH_PX}px` } as CSSProperties;

/**
 * Legend drawer behaviour:
 * - `false` → no drawer mounted.
 * - `'hidden'` → toggle button visible, drawer collapsed at mount.
 * - `'auto'` → drawer open at mount on viewports ≥ 768px.
 */
type LegendMode = false | 'hidden' | 'auto';

/** Floating search overlay (mutually exclusive). */
type SearchMode = 'none' | 'network' | 'eligibility';

const getAddressId = (coordinates: Point) => coordinates.join('--');

type NetworkSearchMarker = {
  coordinates: [number, number];
  label: string;
  eligibility: HeatNetworksResponse;
};

export type MapProps = {
  /** Initial map configuration. Changing this prop after mount has no effect. */
  config: DeepPartial<MapConfiguration>;
  initialView?: InitialView;
  /** Restricts panning to this `[w, s, e, n]` box. */
  maxBounds?: BBox;
  /** Zoom bounds (default to the map's). */
  minZoom?: number;
  maxZoom?: number;
  /** Disables pan/zoom/touch and built-in controls (attribution still renders). */
  interactive?: boolean;
  /** Imperative access from outside the subtree (`flyTo`, `fitBounds`). */
  mapRef?: RefObject<MapCanvasController | null>;
  legend?: LegendMode;
  /** Custom legend rendered inside the drawer instead of the default full app legend (composed by the caller). */
  legendContent?: React.ReactNode;
  search?: SearchMode;
  /** Placeholder for the search overlay's input. */
  searchPlaceholder?: string;
  /** Enables the right-click context menu (currently a "test eligibility at this point" action). Gate by role at the call site. */
  contextMenu?: boolean;
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
  maxBounds,
  minZoom,
  maxZoom,
  interactive = true,
  mapRef: externalMapRef,
  legend = false,
  legendContent,
  search = 'none',
  searchPlaceholder,
  contextMenu = false,
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
  // Eligibility-search tracking (Matomo + PostHog), parity with the public map.
  const { handleOnFetchAddress, handleOnSuccessAddress } = useContactFormFCU();
  // Persisted across reloads (localStorage), shared across map instances.
  const { value: soughtAddresses, set: setSoughtAddresses } = useLocalStorageValue<StoredAddress[], StoredAddress[], true>(
    'mapSoughtAddresses',
    { defaultValue: [], initializeWithValue: true }
  );
  const addresses = soughtAddresses ?? [];
  const [selectedCardIndex, setSelectedCardIndex] = useState(0);
  const [resultsVisible, setResultsVisible] = useState(false);
  // Marker for the simple `search='network'` mode — single address at a time,
  // displayed with an inline popup; removed when the user clears the input.
  const [networkSearchMarker, setNetworkSearchMarker] = useState<NetworkSearchMarker | null>(null);

  const handleNetworkSelect = async (result: MapSearchResult) => {
    const controller = effectiveRef.current;
    if (!controller) return;
    // Any new selection (address or network) clears the previous marker — only
    // the latest address selection materializes a marker on the map.
    setNetworkSearchMarker(null);
    if (result.kind === 'network') {
      controller.fitBounds(result.bbox, { maxZoom: 14, padding: 50 });
      return;
    }
    controller.flyTo(result.coordinates, { zoom: result.isCity ? 13 : 16 });
    try {
      const [lng, lat] = result.coordinates;
      const eligibility = result.isCity
        ? await trpcUtils.client.reseaux.cityNetwork.query({ city: result.feature.properties.city })
        : await trpcUtils.client.reseaux.eligibilityStatus.query({ lat, lon: lng });
      setNetworkSearchMarker({ coordinates: result.coordinates, eligibility, label: result.label });
    } catch {
      notify('error', 'Impossible de tester cette adresse. Réessayez ou contactez le support.');
    }
  };

  const handleEligibilitySelect = async (selection: AddressSelection) => {
    const controller = effectiveRef.current;
    try {
      const [lng, lat] = selection.coordinates;
      const eligibility = selection.isCity
        ? await trpcUtils.client.reseaux.cityNetwork.query({ city: selection.feature.properties.city })
        : await trpcUtils.client.reseaux.eligibilityStatus.query({ lat, lon: lng });
      controller?.flyTo(selection.coordinates, { zoom: selection.isCity ? 13 : 16 });
      const id = getAddressId(selection.coordinates);
      const newAddress: StoredAddress = {
        address: selection.label,
        addressDetails: { geoAddress: selection.feature, network: eligibility },
        coordinates: selection.coordinates,
        id,
        search: { date: Date.now() },
      };
      const existing = addresses.findIndex((entry) => entry.id === id);
      if (existing === -1) {
        handleOnFetchAddress({ address: selection.label }, 'carte');
        handleOnSuccessAddress({ address: selection.label, eligibility, geoAddress: selection.feature }, 'carte');
        setSoughtAddresses([newAddress, ...addresses]);
        setSelectedCardIndex(0);
      } else {
        setSelectedCardIndex(existing);
      }
      setResultsVisible(true);
      trackPostHogEvent('map:address_searched');
    } catch {
      notify('error', 'Impossible de tester cette adresse. Réessayez ou contactez le support.');
    }
  };

  const jumpTo = useCallback(
    ({ coordinates, zoom }: { coordinates: Point; zoom?: number }) => {
      effectiveRef.current?.flyTo(coordinates, { zoom: zoom ?? 16 });
    },
    [effectiveRef]
  );

  const handleRemoveAddress = useCallback(
    (entry: StoredAddress) => {
      setSelectedCardIndex(-1);
      setSoughtAddresses(addresses.filter((a) => a.id !== entry.id));
    },
    [addresses, setSoughtAddresses]
  );

  const handleMarkContacted = useCallback(
    (entry: StoredAddress) => {
      setSoughtAddresses(addresses.map((a) => (a.id === entry.id ? { ...a, contacted: true } : a)));
    },
    [addresses, setSoughtAddresses]
  );

  const handleResetAddresses = useCallback(() => {
    setSelectedCardIndex(-1);
    setSoughtAddresses([]);
  }, [setSoughtAddresses]);

  // Default position: left-3. When the legend feature is active the 30px-wide
  // toggle sits at the left edge — push the search column to `left-[30px]` so
  // they touch but don't overlap. With the drawer open on `@xl`, slide past both
  // the drawer (`--legend-drawer-width`, +35px gap) and its toggle.
  const searchClassName = cx(
    'absolute top-3 z-10 w-80 transition-[left,max-width] duration-200',
    legend && !legendOpen ? 'left-[30px] max-w-[calc(100%-2.5rem)]' : 'left-3 max-w-[calc(100%-1.5rem)]',
    legendOpen && '@xl:left-[calc(var(--legend-drawer-width)_+_35px)] @xl:max-w-[calc(100%_-_var(--legend-drawer-width)_-_47px)]'
  );

  const wrapperClass = cx(
    '@container relative h-full w-full',
    '[&_.maplibregl-ctrl-bottom-left]:transition-[margin-left] [&_.maplibregl-ctrl-bottom-left]:duration-200',
    '[&_.maplibregl-ctrl-top-left]:transition-[margin-left] [&_.maplibregl-ctrl-top-left]:duration-200',
    legendOpen &&
      '@xl:[&_.maplibregl-ctrl-bottom-left]:ml-(--legend-drawer-width) @xl:[&_.maplibregl-ctrl-top-left]:ml-(--legend-drawer-width)',
    className
  );

  return (
    <div className={wrapperClass} style={mapWrapperStyle}>
      <MapCanvas
        mapRef={effectiveRef}
        initialView={initialView}
        maxBounds={maxBounds}
        minZoom={minZoom}
        maxZoom={maxZoom}
        interactive={interactive}
        layers={allLayers}
        config={config}
      >
        <MapInstanceSync />
        {contextMenu && <MapContextMenu />}
        {legend && <MapDrawHost />}
        {legend && <LegendPaddingSync />}
        {search === 'eligibility' &&
          addresses.map((entry) => (
            <MapMarker
              key={entry.id}
              longitude={entry.coordinates[0]}
              latitude={entry.coordinates[1]}
              color={entry.addressDetails.network.isEligible ? '#0D543F' : '#aaaaaa'}
            />
          ))}
        {search === 'network' && networkSearchMarker && (
          <MapMarker
            key={networkSearchMarker.coordinates.join(',')}
            longitude={networkSearchMarker.coordinates[0]}
            latitude={networkSearchMarker.coordinates[1]}
            color="#4550e5"
            popupContent={(close) => (
              <EligibilityPopup label={networkSearchMarker.label} eligibility={networkSearchMarker.eligibility} close={close} />
            )}
          />
        )}
        {children}
      </MapCanvas>

      {legend && <LegendDrawer>{legendContent}</LegendDrawer>}

      {search === 'network' && (
        <MapSearchInput
          onSelect={handleNetworkSelect}
          onClear={() => setNetworkSearchMarker(null)}
          placeholder={searchPlaceholder}
          className={searchClassName}
        />
      )}
      {search === 'eligibility' && (
        <div className={cx(searchClassName, 'flex flex-col gap-1 bg-white rounded-lg shadow-md p-3')}>
          <h2 className="text-base font-bold mb-0 text-(--text-title-grey)">Rechercher une adresse</h2>
          <AddressSearchInput onSelect={handleEligibilitySelect} placeholder={searchPlaceholder} />
          <EligibilityResultsPanel
            addresses={addresses}
            visible={resultsVisible}
            setVisible={setResultsVisible}
            selectedIndex={selectedCardIndex}
            setSelectedIndex={setSelectedCardIndex}
            onJumpTo={jumpTo}
            onRemove={handleRemoveAddress}
            onContacted={handleMarkContacted}
            onReset={handleResetAddresses}
          />
        </div>
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
