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
  /** Id of the selected address, highlighted via the dedicated single-feature source. */
  selectedId?: string | null;
  /** Called with the demand id when a marker is clicked. */
  onSelect?: (id: string) => void;
};

const toFeature = (adresse: AdresseEligible): GeoJSON.Feature => ({
  geometry: { coordinates: [adresse.longitude, adresse.latitude], type: 'Point' },
  id: adresse.id,
  properties: { ...adresse },
  type: 'Feature',
});

/**
 * Drives the built-in `adressesEligibles` source from a list of addresses, plus optional
 * auto-fit / fly-to / click-selection. The selected address is pushed into its own
 * `adressesEligiblesSelected` source so selecting a row only updates one feature instead of
 * rebuilding the whole collection.
 */
export function AdressesEligiblesLayer({ adresses, autoFit = false, flyToLocation, selectedId, onSelect }: AdressesEligiblesLayerProps) {
  // Each source's `data` is memoized independently so `useMapLayers` only calls `setData` on the
  // source that actually changed (selecting a row leaves the big collection's reference intact).
  const adressesData = useMemo<GeoJSON.FeatureCollection>(
    () => ({ features: adresses.map(toFeature), type: 'FeatureCollection' }),
    [adresses]
  );

  const selectedAdresse = useMemo(
    () => (selectedId ? adresses.find((adresse) => adresse.id === selectedId) : undefined),
    [adresses, selectedId]
  );
  const selectedData = useMemo<GeoJSON.FeatureCollection>(
    () => ({ features: selectedAdresse ? [toFeature(selectedAdresse)] : [], type: 'FeatureCollection' }),
    [selectedAdresse]
  );

  const sources = useMemo<MapDynamicSource[]>(
    () => [
      { data: adressesData, id: 'adressesEligibles' },
      { data: selectedData, id: 'adressesEligiblesSelected' },
    ],
    [adressesData, selectedData]
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
