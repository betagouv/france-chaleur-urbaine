import { SuggestionItem } from './Suggestions';

export type HeatNetwork = {
  isEligible: boolean;
  distance: number | null;
  veryEligibleDistance: number | null;
  inPDP: boolean;
  isBasedOnIris: boolean;
  futurNetwork: boolean;
  id: string | null;
  name: string | null;
  tauxENRR: number | null;
  gestionnaire: string | null;
  co2: number | null;
  isClasse: boolean | null;
  hasPDP: boolean | null;
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

export type HandleAddressSelect = (address: string, coordinates: Point, geoAddress: AddressDetail) => void;
