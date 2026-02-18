import type { SuggestionItem } from '@/modules/ban/types';

export type HeatNetwork = {
  isEligible: boolean;
  distance: number | null;
  veryEligibleDistance: number | null;
  inPDP: boolean;
  futurNetwork: boolean;
  id: string | null;
  name: string | null;
  tauxENRR: number | null;
  gestionnaire: string | null;
  co2: number | null;
  isClasse: boolean | null;
  hasPDP: boolean | null;
  hasNoTraceNetwork: boolean | null;
};

export type CityNetwork = {
  basedOnCity: true;
  cityHasNetwork: boolean;
  cityHasFuturNetwork: boolean;
};

export type HeatNetworksResponse = HeatNetwork & CityNetwork;

export type BatEnr = {
  ppa: boolean;
  gmi: boolean;
};

export type AddressDetail = {
  geoAddress?: SuggestionItem;
  network: HeatNetworksResponse;
  batEnr?: BatEnr;
};

export type HandleAddressSelect = (address: string, coordinates: Point, geoAddress: AddressDetail) => void;
