export type SuggestionItem = {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: number[];
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
};
export type Point = number[];
export type SuggestionResponse = {
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
};

export type Suggestions = SuggestionResponse['features'];

export type Coords = {
  lon: number;
  lat: number;
};

export type HeatNetworksResponse = {
  msg: string;
  latOrigin: number;
  lonOrigin: number;
  latPointReseau: number;
  lonPointReseau: number;
  distPointReseau: number;
};
