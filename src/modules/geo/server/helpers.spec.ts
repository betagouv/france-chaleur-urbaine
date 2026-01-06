import { describe, expect, it } from 'vitest';

import type { TestCase } from '@/tests/trpc-helpers';

import { detectSrid } from './helpers';

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
