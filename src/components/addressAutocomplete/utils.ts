import { Coords, Point, Suggestions } from '../../types';

export const findPointFromAddressAndSuggestions = (
  address: string,
  suggestions: Suggestions | []
): Point => {
  const suggestion = suggestions.find(
    (item) => item.properties.label === address
  );
  return suggestion?.geometry.coordinates || [0, 0];
};

export const convertPointToCoordinates = (point: Point): Coords => ({
  lon: point[0],
  lat: point[1],
});
export enum Status {
  Idle = 'idle',
  Loading = 'loading',
  Success = 'success',
  Error = 'error',
}
export type ValueOf<Obj> = Obj[keyof Obj];
