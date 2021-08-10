import { AddressFields } from '@core/domain/entity/address';
import { AddressEligibility } from '@core/domain/entity/AddressEligibility';
import { IsANullNetwork } from '@core/domain/entity/network';
import { AddressDTO, AddressPyrisResponse } from './address.dto';

export default class AddressMapper {
  static toDomain(address: AddressPyrisResponse): AddressFields {
    return {
      lat: address.lat,
      lon: address.lon,
      label: address.address,
      cityCode: address.citycode,
      irisCode: address.complete_code,
    };
  }
  static toDTO({
    address,
    isEligible,
    network,
  }: AddressEligibility): AddressDTO {
    return {
      lat: address.lat,
      lon: address.lon,
      network: IsANullNetwork(network) ? null : network,
      isEligible,
    };
  }
}
