import { SuggestionItem } from './Suggestions';

export interface HeatNetworksResponse {
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
}

export interface AddressDetail {
  geoAddress?: SuggestionItem;
  network: HeatNetworksResponse;
}

export type HandleAddressSelect = (
  address: string,
  coordinates: Point,
  geoAddress: AddressDetail
) => void;
