import { center } from '@turf/center';

import type { AddressEligibilityContextInput, BatEnrBatiment } from '../constants';

export type NetworkEligibilityCoordinates = Pick<AddressEligibilityContextInput, 'lat' | 'lon'>;

/**
 * Returns the point used for heating and cooling network distance checks.
 */
export function getNetworkEligibilityCoordinates(
  addressCoordinates: NetworkEligibilityCoordinates,
  selectedBatEnrBatiment?: Pick<BatEnrBatiment, 'geometry'> | null
): NetworkEligibilityCoordinates {
  if (!selectedBatEnrBatiment?.geometry) {
    return addressCoordinates;
  }

  const centerFeature = center(selectedBatEnrBatiment.geometry);
  const centerCoordinates = centerFeature.geometry.coordinates;
  const lon = centerCoordinates[0];
  const lat = centerCoordinates[1];

  return Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : addressCoordinates;
}
