import { Coords } from '@/types/Coords';
import { Point } from '@/types/Point';

const convertPointToCoordinates = (point: Point): Coords => ({
  lon: point[0],
  lat: point[1],
});

export default convertPointToCoordinates;
