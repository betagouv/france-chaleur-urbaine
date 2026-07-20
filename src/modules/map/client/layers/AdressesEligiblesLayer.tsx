import { useEffect, useMemo } from 'react';

import { useMapInstance, useMapReady } from '@/modules/map/client/core/MapCanvasContext';
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
  /** Id of the selected address, highlighted via the `selected` feature-state. */
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
 * auto-fit / fly-to / click-selection. The selected address is flagged via the `selected`
 * feature-state (same mechanism as hover), so selecting a row only toggles paint properties —
 * no source data nor layer rebuild.
 */
export function AdressesEligiblesLayer({ adresses, autoFit = false, flyToLocation, selectedId, onSelect }: AdressesEligiblesLayerProps) {
  const map = useMapInstance();
  const mapReady = useMapReady();

  const adressesData = useMemo<GeoJSON.FeatureCollection>(
    () => ({ features: adresses.map(toFeature), type: 'FeatureCollection' }),
    [adresses]
  );

  const sources = useMemo<MapDynamicSource[]>(() => [{ data: adressesData, id: 'adressesEligibles' }], [adressesData]);
  useMapLayers({ sources });

  // Feature-states survive `setData`, so this effect only depends on the selection itself.
  useEffect(() => {
    if (!mapReady || !selectedId) {
      return;
    }
    map.setFeatureState({ id: selectedId, source: 'adressesEligibles' }, { selected: true });
    return () => {
      // the source may already be gone when the whole map is tearing down
      if (map.getSource('adressesEligibles')) {
        map.removeFeatureState({ id: selectedId, source: 'adressesEligibles' }, 'selected');
      }
    };
  }, [map, mapReady, selectedId]);

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
