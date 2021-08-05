import { Network } from '@core/domain/entity/network';

export interface Coords {
  lat: number;
  lon: number;
}
export interface AddressFields extends Coords {
  cityCode: string;
  label: string;
  irisCode: string;
}
export abstract class Address {
  constructor(
    public lat: number,
    public lon: number,
    public label: string,
    public cityCode: string,
    public irisCode: string
  ) {}
  abstract isEligibleWith(network: Network): boolean;
  abstract get isIDF(): boolean;
  static isInIDF(cityCode: string) {
    const idfCityCodePrefix: number[] = [75, 77, 78, 91, 92, 93, 94, 95];
    return idfCityCodePrefix.includes(Number(cityCode.slice(0, 2)));
  }
}
