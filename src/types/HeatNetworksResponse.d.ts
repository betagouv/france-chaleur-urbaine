import { Address } from '@core/domain/entity/address';

export interface HeatNetworksResponse {
  lat: number;
  lon: number;
  network: Network;
  inZDP: boolean;
  isEligible: boolean;
}

export interface Network {
  lat: number | null;
  lon: number | null;
  irisCode: string | number | null;
  filiere: string | null;
  distance: number | null;
}

export interface AddressEligibility {
  address: Address;
  network: Network;
  isEligible: boolean;
  inZDP: boolean;
}
