import { describe, expect, it } from 'vitest';

import type { TestCase } from '@/tests/trpc-helpers';

import { detectSrid, isWgs84Geometry, processGeometryToWgs84 } from './helpers';

describe('detectSrid', () => {
  type SridTestCase = TestCase<GeoJSON.Geometry, number>;

  const testCases: SridTestCase[] = [
    {
      expectedOutput: 4326,
      input: {
        coordinates: [2.3522, 48.8566],
        type: 'Point',
      },
      label: 'WGS84 Point geometry (Paris coordinates)',
    },
    {
      expectedOutput: 2154,
      input: {
        coordinates: [652123.45, 6862725.23],
        type: 'Point',
      },
      label: 'non-WGS84 Point geometry (Lambert 93 coordinates)',
    },
    {
      expectedOutput: 4326,
      input: {
        coordinates: [
          [2.3522, 48.8566],
          [2.2945, 48.8582],
        ],
        type: 'LineString',
      },
      label: 'WGS84 LineString geometry (Paris area)',
    },
    {
      expectedOutput: 4326,
      input: {
        coordinates: [
          [
            [2.3522, 48.8566],
            [2.3522, 48.9],
            [2.4, 48.9],
            [2.4, 48.8566],
            [2.3522, 48.8566],
          ],
        ],
        type: 'Polygon',
      },
      label: 'WGS84 Polygon geometry (Paris area)',
    },
    {
      expectedOutput: 4326,
      input: {
        coordinates: [
          [
            [0.591683, 49.098489],
            [0.591782, 49.098881],
            [0.59397, 49.099499],
          ],
          [
            [0.594831, 49.105262],
            [0.595, 49.106],
          ],
        ],
        type: 'MultiLineString',
      },
      label: 'WGS84 MultiLineString geometry (Normandy coordinates)',
    },
    {
      expectedOutput: 4326,
      input: {
        coordinates: [
          [
            [
              [2.3522, 48.8566],
              [2.3522, 48.9],
              [2.4, 48.9],
              [2.4, 48.8566],
              [2.3522, 48.8566],
            ],
          ],
          [
            [
              [2.5, 48.8],
              [2.5, 48.85],
              [2.55, 48.85],
              [2.55, 48.8],
              [2.5, 48.8],
            ],
          ],
        ],
        type: 'MultiPolygon',
      },
      label: 'WGS84 MultiPolygon geometry (Paris region)',
    },
    {
      expectedOutput: 2154,
      input: {
        coordinates: [
          [
            [
              [652123.45, 6862725.23],
              [652123.45, 6863000.0],
              [652500.0, 6863000.0],
              [652500.0, 6862725.23],
              [652123.45, 6862725.23],
            ],
          ],
        ],
        type: 'MultiPolygon',
      },
      label: 'non-WGS84 MultiPolygon geometry (Lambert 93 coordinates)',
    },
  ];

  it.each(testCases)('$label', ({ input, expectedOutput }) => {
    expect(detectSrid(input)).toEqual(expectedOutput);
  });
});

describe('isWgs84Geometry', () => {
  const testCases: TestCase<GeoJSON.Geometry, boolean>[] = [
    { expectedOutput: true, input: { coordinates: [2.3522, 48.8566], type: 'Point' }, label: 'point WGS84 (Paris)' },
    {
      expectedOutput: true,
      input: {
        coordinates: [
          [
            [7.7, 48.6],
            [7.71, 48.61],
          ],
        ],
        type: 'MultiLineString',
      },
      label: 'multiligne WGS84 (Strasbourg)',
    },
    {
      expectedOutput: false,
      input: {
        coordinates: [
          [
            [1046325.9, 6844165.2],
            [1046326.3, 6844165.6],
          ],
        ],
        type: 'MultiLineString',
      },
      label: 'multiligne en Lambert 93 (mètres)',
    },
    {
      expectedOutput: false,
      input: {
        coordinates: [
          [
            [
              [0, 0],
              [0, 95],
              [1, 95],
              [0, 0],
            ],
          ],
        ],
        type: 'MultiPolygon',
      },
      label: 'multipolygone avec une latitude hors bornes',
    },
  ];

  it.each(testCases)('$label', ({ input, expectedOutput }) => {
    expect(isWgs84Geometry(input)).toStrictEqual(expectedOutput);
  });
});

describe('processGeometryToWgs84', () => {
  it('rejects metre coordinates outside the Lambert 93 extent (another projection, e.g. CC49)', async () => {
    await expect(
      processGeometryToWgs84({
        coordinates: [
          [
            [1650000, 8180000],
            [1650100, 8180100],
          ],
        ],
        type: 'MultiLineString',
      })
    ).rejects.toThrow('Projection du fichier non prise en charge');
  });

  it('rejects a declared projection other than WGS84 or Lambert 93', async () => {
    await expect(
      processGeometryToWgs84({
        crs: { properties: { name: 'urn:ogc:def:crs:EPSG::3857' }, type: 'name' },
        features: [{ geometry: { coordinates: [261000, 6250000], type: 'Point' }, properties: {}, type: 'Feature' }],
        type: 'FeatureCollection',
      })
    ).rejects.toThrow('Projection du fichier non prise en charge');
  });

  it('returns a WGS84 geometry as is', async () => {
    expect(await processGeometryToWgs84({ coordinates: [2.3522, 48.8566], type: 'Point' })).toStrictEqual({
      coordinates: [2.3522, 48.8566],
      type: 'Point',
    });
  });
});
