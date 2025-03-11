import { describe, expect, test } from 'vitest';

import { detectSrid } from './geo';

type TestCase = {
  description: string;
  input: GeoJSON.Geometry;
  expected: ReturnType<typeof detectSrid>;
};

const testCases: TestCase[] = [
  {
    description: 'WGS84 Point geometry (Paris coordinates)',
    input: {
      type: 'Point',
      coordinates: [2.3522, 48.8566],
    },
    expected: 4326,
  },
  {
    description: 'non-WGS84 Point geometry (Lambert 93 coordinates)',
    input: {
      type: 'Point',
      coordinates: [652123.45, 6862725.23],
    },
    expected: 2154,
  },
  {
    description: 'WGS84 LineString geometry (Paris area)',
    input: {
      type: 'LineString',
      coordinates: [
        [2.3522, 48.8566],
        [2.2945, 48.8582],
      ],
    },
    expected: 4326,
  },
  {
    description: 'WGS84 Polygon geometry (Paris area)',
    input: {
      type: 'Polygon',
      coordinates: [
        [
          [2.3522, 48.8566],
          [2.3522, 48.9],
          [2.4, 48.9],
          [2.4, 48.8566],
          [2.3522, 48.8566],
        ],
      ],
    },
    expected: 4326,
  },
  {
    description: 'WGS84 MultiLineString geometry (Normandy coordinates)',
    input: {
      type: 'MultiLineString',
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
    },
    expected: 4326,
  },
  {
    description: 'WGS84 MultiPolygon geometry (Paris region)',
    input: {
      type: 'MultiPolygon',
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
    },
    expected: 4326,
  },
  {
    description: 'non-WGS84 MultiPolygon geometry (Lambert 93 coordinates)',
    input: {
      type: 'MultiPolygon',
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
    },
    expected: 2154,
  },
];

describe('detectSrid', () => {
  testCases.forEach(({ description, input, expected }) => {
    test(description, () => {
      expect(detectSrid(input)).toEqual(expected);
    });
  });
});
