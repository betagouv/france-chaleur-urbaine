import type { Point } from '@/types/Point';

export type SuggestionItem = {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: Point;
  };
  properties: {
    label: string;
    score: number;
    housenumber: string;
    id: string;
    type: 'housenumber' | 'street' | 'locality' | 'municipality';
    name: string;
    postcode: string;
    citycode: string;
    x: number;
    y: number;
    city: string;
    district?: string;
    context: string;
    importance: number;
    street: string;
  };
};
