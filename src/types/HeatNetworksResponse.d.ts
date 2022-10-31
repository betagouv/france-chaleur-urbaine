import { SuggestionItem } from './Suggestions';

export interface HeatNetworksResponse {
  isEligible: boolean;
  distance: number | null;
  inZDP: boolean;
  isBasedOnIris: boolean;
  futurNetwork: boolean;
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
