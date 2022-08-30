import { AddressFields } from '@core/domain/entity/address';
import { AddressPyrisResponse } from './address.dto';

export default class AddressMapper {
  static toDomain(address: AddressPyrisResponse): AddressFields {
    return {
      lat: address.lat,
      lon: address.lon,
      label: address.address,
      city: address.city,
      cityCode: address.citycode,
      irisCode: address.complete_code,
    };
  }
}
