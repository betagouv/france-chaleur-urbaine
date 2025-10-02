import type { Coords } from '@/types/Coords';
import type { Point } from '@/types/Point';

const convertPointToCoordinates = (point: Point): Coords => ({
  lat: point[1],
  lon: point[0],
});

export default convertPointToCoordinates;
