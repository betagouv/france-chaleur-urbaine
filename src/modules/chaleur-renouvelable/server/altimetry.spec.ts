import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchJSON } from '@/utils/network';

import { getAltitudeByCoordinates } from './altimetry';

vi.mock('@/utils/network', () => ({
  fetchJSON: vi.fn(),
}));

const mockedFetchJSON = vi.mocked(fetchJSON);

describe('altimetry service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches the altitude from the Géoplateforme elevation endpoint', async () => {
    mockedFetchJSON.mockResolvedValueOnce({ elevations: [164.34] });

    const altitude = await getAltitudeByCoordinates({ lat: 43.54, lon: 1.48 });

    expect(altitude).toStrictEqual(164.34);
    expect(mockedFetchJSON).toHaveBeenCalledWith('https://data.geopf.fr/altimetrie/1.0/calcul/alti/rest/elevation.json', {
      params: {
        delimiter: '|',
        indent: false,
        lat: 43.54,
        lon: 1.48,
        measures: false,
        resource: 'ign_rge_alti_wld',
        zonly: true,
      },
    });
  });

  it('returns null when the point is outside the covered area', async () => {
    mockedFetchJSON.mockResolvedValueOnce({ elevations: [-99999] });

    const altitude = await getAltitudeByCoordinates({ lat: 43.54, lon: 1.48 });

    expect(altitude).toStrictEqual(null);
  });
});
