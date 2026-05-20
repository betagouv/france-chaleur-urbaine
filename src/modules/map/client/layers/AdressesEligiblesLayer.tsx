import { useMemo } from 'react';

import { useMapFeatureClick } from '@/modules/map/client/interactions/clickHandlers';
import { MapFitBounds } from '@/modules/map/client/interactions/MapFitBounds';
import { MapFlyTo } from '@/modules/map/client/interactions/MapFlyTo';
import type { AdresseEligible } from '@/modules/map/client/layers/specs/adressesEligibles';
import { type MapDynamicSource, useMapLayers } from '@/modules/map/client/layers/useMapLayers';
import type { BBox } from '@/modules/map/shared/types';

type AdressesEligiblesLayerProps = {
  adresses: AdresseEligible[];
  /** Fit the map on the addresses bounds whenever they change. */
  autoFit?: boolean;
  /** Fly to this location when it changes. */
  flyToLocation?: { center: [number, number]; zoom: number };
  /** Called with the demand id when a marker is clicked. */
  onSelect?: (id: string) => void;
};

/**
 * Drives the built-in `adressesEligibles` source from a list of addresses, plus optional
 * auto-fit / fly-to / click-selection.
 */
export function AdressesEligiblesLayer({ adresses, autoFit = false, flyToLocation, onSelect }: AdressesEligiblesLayerProps) {
  // Push the addresses into the built-in `adressesEligibles` source (data-driven, memoized
  // so `useMapLayers` only calls `setData` when the addresses actually change).
  const sources = useMemo<MapDynamicSource[]>(
    () => [
      {
        data: {
          features: adresses.map((adresse) => ({
            geometry: { coordinates: [adresse.longitude, adresse.latitude], type: 'Point' },
            id: adresse.id,
            properties: { ...adresse },
            type: 'Feature',
          })),
          type: 'FeatureCollection',
        },
        id: 'adressesEligibles',
      },
    ],
    [adresses]
  );
  useMapLayers({ sources });

  // Selection on marker click — routed through the single MapInteractions handler (same feature as
  // the popup it opens). The base layer keeps its popup; this just adds the side-effect.
  useMapFeatureClick('adressesEligibles', (feature) => onSelect?.(String(feature.id)));

  const autoFitBbox = useMemo<BBox | undefined>(() => {
    if (!autoFit || adresses.length === 0) {
      return undefined;
    }
    const longitudes = adresses.map((adresse) => adresse.longitude);
    const latitudes = adresses.map((adresse) => adresse.latitude);
    return [Math.min(...longitudes), Math.min(...latitudes), Math.max(...longitudes), Math.max(...latitudes)];
  }, [adresses, autoFit]);

  return (
    <>
      <MapFitBounds bbox={autoFitBbox} maxZoom={16} />
      {flyToLocation && <MapFlyTo center={flyToLocation.center} zoom={flyToLocation.zoom} />}
    </>
  );
}
