import { SuggestionItem } from './Suggestions';

export type HeatNetwork = {
  isEligible: boolean;
  distance: number | null;
  veryEligibleDistance: number | null;
  inZDP: boolean;
  isBasedOnIris: boolean;
  futurNetwork: boolean;
  id: string | null;
  tauxENRR: number | null;
  gestionnaire: string | null;
  co2: number | null;
};

export type CityNetwork = {
  basedOnCity: true;
  cityHasNetwork: boolean;
  cityHasFuturNetwork: boolean;
};

export type HeatNetworksResponse = HeatNetwork & CityNetwork;

export type FullHeatNetworksResponse = HeatNetworksResponse & {
  distance: number;
};

export type AddressDetail = {
  geoAddress?: SuggestionItem;
  network: HeatNetworksResponse;
};

export type HandleAddressSelect = (
  address: string,
  coordinates: Point,
  geoAddress: AddressDetail
) => void;
