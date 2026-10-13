import type { BANAddressFeature } from '@/modules/ban/types';

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
  /** FCU holds a more recent gestionnaire than the FEDENE survey: shown with a footnote */
  gestionnaireSourceFcu?: boolean;
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

export type AddressDetail = {
  geoAddress?: BANAddressFeature;
  network: HeatNetworksResponse;
};

export type HandleAddressSelect = (address: string, coordinates: Point, geoAddress: AddressDetail) => void;
