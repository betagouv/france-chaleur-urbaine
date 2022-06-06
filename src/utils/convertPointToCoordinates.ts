import { Coords, Point } from 'src/types';

const convertPointToCoordinates = (point: Point): Coords => ({
  lon: point[0],
  lat: point[1],
});

export default convertPointToCoordinates;
