import type { Coords } from '@/modules/geo/types';
import type { Point } from '@/types/Point';

const convertPointToCoordinates = (point: Point): Coords => ({
  lat: point[1],
  lon: point[0],
});

export default convertPointToCoordinates;
