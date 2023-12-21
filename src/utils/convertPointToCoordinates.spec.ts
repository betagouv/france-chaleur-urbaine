import { expect, test } from 'vitest';
import convertPointToCoordinates from './convertPointToCoordinates';

test('convertPointToCoordinates()', () => {
  expect(convertPointToCoordinates([1, 2])).toStrictEqual({
    lon: 1,
    lat: 2,
  });
});
