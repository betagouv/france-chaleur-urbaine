import { Coords } from 'src/types/Coords';
import { Point } from 'src/types/Point';

const convertPointToCoordinates = (point: Point): Coords => ({
  lon: point[0],
  lat: point[1],
});

export default convertPointToCoordinates;
