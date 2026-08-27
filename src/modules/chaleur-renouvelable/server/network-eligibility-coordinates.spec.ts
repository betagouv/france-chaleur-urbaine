import { describe, expect, it } from 'vitest';

import { getNetworkEligibilityCoordinates } from './network-eligibility-coordinates';

describe('getNetworkEligibilityCoordinates', () => {
  const addressCoordinates = { lat: 48, lon: 2 };

  it('returns address coordinates when no selected building geometry is available', () => {
    expect(getNetworkEligibilityCoordinates(addressCoordinates, null)).toStrictEqual(addressCoordinates);
  });

  it('returns selected building center coordinates when a geometry is available', () => {
    expect(
      getNetworkEligibilityCoordinates(addressCoordinates, {
        geometry: {
          coordinates: [
            [
              [2, 48],
              [4, 48],
              [4, 50],
              [2, 50],
              [2, 48],
            ],
          ],
          type: 'Polygon',
        },
      })
    ).toStrictEqual({ lat: 49, lon: 3 });
  });
});
