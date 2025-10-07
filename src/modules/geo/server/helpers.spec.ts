import { describe, expect, test } from 'vitest';

import { detectSrid } from './helpers';

type TestCase = {
  description: string;
  input: GeoJSON.Geometry;
  expected: ReturnType<typeof detectSrid>;
};

const testCases: TestCase[] = [
  {
    description: 'WGS84 Point geometry (Paris coordinates)',
    expected: 4326,
    input: {
      coordinates: [2.3522, 48.8566],
      type: 'Point',
    },
  },
  {
    description: 'non-WGS84 Point geometry (Lambert 93 coordinates)',
    expected: 2154,
    input: {
      coordinates: [652123.45, 6862725.23],
      type: 'Point',
    },
  },
  {
    description: 'WGS84 LineString geometry (Paris area)',
    expected: 4326,
    input: {
      coordinates: [
        [2.3522, 48.8566],
        [2.2945, 48.8582],
      ],
      type: 'LineString',
    },
  },
  {
    description: 'WGS84 Polygon geometry (Paris area)',
    expected: 4326,
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
  },
  {
    description: 'WGS84 MultiLineString geometry (Normandy coordinates)',
    expected: 4326,
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
  },
  {
    description: 'WGS84 MultiPolygon geometry (Paris region)',
    expected: 4326,
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
  },
  {
    description: 'non-WGS84 MultiPolygon geometry (Lambert 93 coordinates)',
    expected: 2154,
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
  },
];

describe('detectSrid', () => {
  testCases.forEach(({ description, input, expected }) => {
    test(description, () => {
      expect(detectSrid(input)).toEqual(expected);
    });
  });
});
