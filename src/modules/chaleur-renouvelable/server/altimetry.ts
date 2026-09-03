import { serverConfig } from '@/server/config';
import { fetchJSON } from '@/utils/network';

import type { NetworkEligibilityCoordinates } from './network-eligibility-coordinates';

const GEOPLATEFORME_ALTIMETRY_RESOURCE = 'ign_rge_alti_wld';
const GEOPLATEFORME_ALTIMETRY_UNCOVERED_ALTITUDE = -99999;

type GeoplatformAltimetryResponse = {
  elevations: number[];
};

/**
 * Fetches the ground altitude for a precise WGS84 point from Géoplateforme.
 */
export const getAltitudeByCoordinates = async (coordinates: NetworkEligibilityCoordinates): Promise<number | null> => {
  const data = await fetchJSON<GeoplatformAltimetryResponse>(`${serverConfig.GEOPLATEFORME_ALTIMETRY_API_BASE_URL}/elevation.json`, {
    params: {
      delimiter: '|',
      indent: false,
      lat: coordinates.lat,
      lon: coordinates.lon,
      measures: false,
      resource: GEOPLATEFORME_ALTIMETRY_RESOURCE,
      zonly: true,
    },
  });
  const altitude = data.elevations[0];

  return altitude === GEOPLATEFORME_ALTIMETRY_UNCOVERED_ALTITUDE || !Number.isFinite(altitude) ? null : altitude;
};
