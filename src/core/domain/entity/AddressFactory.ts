import { Address } from '@core/domain/entity/address';
import { isBasedOnIRIS } from '@helpers/address';
import { IRISAdress } from './irisAddress';
import { RegularAddress } from './regularAddress';

export const createAddress = ({
  lat,
  lon,
  label,
  city,
  cityCode,
  irisCode,
}: {
  lat: number;
  lon: number;
  label: string;
  city: string;
  cityCode: string;
  irisCode: string;
}): Address => {
  if (isBasedOnIRIS(cityCode, city)) {
    return new IRISAdress(lat, lon, label, city, cityCode, irisCode);
  }
  return new RegularAddress(lat, lon, label, city, cityCode, irisCode);
};
