export interface SuggestionResponse {
  type: 'FeatureCollection';
  version: string;
  features: SuggestionItem[];
  attribution: string;
  licence: string;
  query: string;
  limit: number;
  filters?: {
    type: string;
  };
}
export interface SuggestionItem {
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
    type: string;
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
}
