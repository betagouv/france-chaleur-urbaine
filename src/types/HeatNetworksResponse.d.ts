import { SuggestionItem } from './Suggestions';

export type HeatNetwork = {
  isEligible: boolean;
  distance: number | null;
  veryEligibleDistance: number | null;
  inZDP: boolean;
  futurNetwork: boolean;
  id: string | null;
  tauxENRR: number | null;
  gestionnaire: string | null;
  co2: number | null;
};

//To keep consistency with API v1
export type HeatNetworkV1 = HeatNetwork & {
  isBasedOnIris: boolean;
};

export type CityNetwork = {
  basedOnCity: true;
  cityHasNetwork: boolean;
  cityHasFuturNetwork: boolean;
};

export type HeatNetworksResponse = HeatNetwork & CityNetwork;

export type AddressDetail = {
  geoAddress?: SuggestionItem;
  network: HeatNetworksResponse;
};

export type HandleAddressSelect = (
  address: string,
  coordinates: Point,
  geoAddress: AddressDetail
) => void;
