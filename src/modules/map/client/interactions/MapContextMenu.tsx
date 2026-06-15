import type { MapMouseEvent } from 'maplibre-gl';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { reverseGeocodeBANAddress } from '@/modules/ban/client';
import { notify } from '@/modules/notification';
import trpc from '@/modules/trpc/client';
import type { HeatNetworksResponse } from '@/types/HeatNetworksResponse';

import { useMapInstance } from '../core/MapCanvasContext';
import { EligibilityPopup, isEligibilityClose, type NearestAddress } from '../search/EligibilityPopup';
import { MapMarker } from './MapMarker';

/** Only surface the reverse-geocoded address when it sits close enough to the tested point. */
const NEAREST_ADDRESS_MAX_DISTANCE_M = 100;

type MenuState = {
  /** Cursor position (px) relative to the map container. */
  x: number;
  y: number;
  lng: number;
  lat: number;
};

type ResultState = {
  lng: number;
  lat: number;
  eligibility: HeatNetworksResponse;
  nearestAddress: NearestAddress | null;
};

/**
 * Right-click context menu on the map. Currently hosts a single action,
 * "tester l'éligibilité à ce point" — more actions can be added later.
 *
 * The eligibility action queries `reseaux.eligibilityStatus` for the clicked
 * coordinates (no address input required) and, in parallel, reverse-geocodes
 * the nearest address (shown only when within {@link NEAREST_ADDRESS_MAX_DISTANCE_M}).
 * A marker stays on the tested point with the result popup. Mounted as a child
 * of `<MapCanvas>` / `<Map>`.
 */
export function MapContextMenu() {
  const map = useMapInstance();
  const trpcUtils = trpc.useUtils();
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<ResultState | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Open the menu on right-click; suppress the native browser context menu.
  useEffect(() => {
    const onContextMenu = (event: MapMouseEvent) => {
      event.preventDefault();
      event.originalEvent.preventDefault();
      setMenu({ lat: event.lngLat.lat, lng: event.lngLat.lng, x: event.point.x, y: event.point.y });
    };
    map.on('contextmenu', onContextMenu);
    return () => {
      map.off('contextmenu', onContextMenu);
    };
  }, [map]);

  // Close the menu on any map movement or an outside pointer press.
  useEffect(() => {
    if (!menu) {
      return;
    }
    const closeMenu = () => setMenu(null);
    const onPointerDown = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    };
    map.on('movestart', closeMenu);
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => {
      map.off('movestart', closeMenu);
      document.removeEventListener('pointerdown', onPointerDown, true);
    };
  }, [map, menu]);

  const handleTest = async () => {
    if (!menu) {
      return;
    }
    const { lat, lng } = menu;
    setPending(true);
    // Eligibility is required; the reverse geocoding is best-effort and must not
    // block the result if it fails.
    const [eligibilityResult, addressResult] = await Promise.allSettled([
      trpcUtils.client.reseaux.eligibilityStatus.query({ lat, lon: lng }),
      reverseGeocodeBANAddress({ lat, lon: lng }),
    ]);
    setPending(false);
    setMenu(null);

    if (eligibilityResult.status === 'rejected') {
      notify('error', 'Impossible de tester ce point. Réessayez ou contactez le support.');
      return;
    }

    const feature = addressResult.status === 'fulfilled' ? addressResult.value : null;
    const distance = feature?.properties.distance;
    const nearestAddress =
      feature && typeof distance === 'number' && distance < NEAREST_ADDRESS_MAX_DISTANCE_M
        ? { distance, label: feature.properties.label }
        : null;
    setResult({ eligibility: eligibilityResult.value, lat, lng, nearestAddress });
  };

  return (
    <>
      {menu &&
        createPortal(
          <div
            ref={menuRef}
            className="absolute z-50 min-w-56 rounded-md border border-(--border-default-grey) bg-white py-1 shadow-lg"
            style={{ left: menu.x, top: menu.y }}
          >
            <button
              type="button"
              onClick={handleTest}
              disabled={pending}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-(--background-default-grey-hover) disabled:opacity-60"
            >
              <span className="fr-icon-search-line fr-icon--sm" aria-hidden />
              {pending ? 'Test en cours…' : "Tester l'éligibilité à ce point"}
            </button>
          </div>,
          map.getContainer()
        )}
      {result && (
        <MapMarker
          key={`${result.lng},${result.lat}`}
          longitude={result.lng}
          latitude={result.lat}
          color={isEligibilityClose(result.eligibility) ? '#0D543F' : '#aaaaaa'}
          defaultPopupOpen
          popupContent={(close) => (
            <EligibilityPopup
              label={`${result.lat.toFixed(5)}, ${result.lng.toFixed(5)}`}
              eligibility={result.eligibility}
              nearestAddress={result.nearestAddress}
              close={close}
            />
          )}
        />
      )}
    </>
  );
}
