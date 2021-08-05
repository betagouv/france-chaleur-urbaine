import { Address } from '@core/domain/entity/address';
import { AddressIdfExcluded } from '@core/domain/entity/addressIdfExcluded';
import { IdfAddress } from '@core/domain/entity/idfAddress';

export class AddressFactory {
  static create({
    lat,
    lon,
    label,
    cityCode,
    irisCode,
  }: {
    lat: number;
    lon: number;
    label: string;
    cityCode: string;
    irisCode: string;
  }) {
    if (Address.isInIDF(cityCode)) {
      return new IdfAddress(lat, lon, label, cityCode, irisCode);
    }
    return new AddressIdfExcluded(lat, lon, label, cityCode, irisCode);
  }
}
