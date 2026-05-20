import type { Point } from '@/types/Point';

export type BANAddressFeature = {
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
    /** Distance (meters) from the queried point. Only set on `/reverse` responses. */
    distance?: number;
  };
};

export type BANAddressResult = {
  address?: string;
  latitude?: number;
  longitude?: number;
} & (
  | {
      result_status: 'ok';
      latitude: number;
      longitude: number;
      result_label: string;
      result_score: number;
      result_city: string;
    }
  | {
      result_status: 'error' | 'not-found' | 'skipped';
      latitude: null;
      longitude: null;
      result_label: null;
      result_score: null;
      result_city: null;
    }
);
