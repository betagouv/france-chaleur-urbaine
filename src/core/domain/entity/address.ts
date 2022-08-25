import { Network } from '@core/domain/entity/network';

export interface Coords {
  lat: number;
  lon: number;
}
export interface AddressFields extends Coords {
  cityCode: string;
  city: string;
  label: string;
  irisCode: string;
}

export abstract class Address {
  constructor(
    public lat: number,
    public lon: number,
    public label: string,
    public city: string,
    public cityCode: string,
    public irisCode: string
  ) {}

  abstract isEligibleWith(network: Network): boolean;
  abstract get isBasedOnIRIS(): boolean;
}
