import { Network } from '@core/domain/entity/network';
import { NetworkRepository } from '@core/domain/repository/networkRepository';
import { Address } from '../entity/address';

export class NetworkService {
  static findNearestOf(
    address: Address,
    networkRepository: NetworkRepository
  ): Promise<Network> {
    if (address.isBasedOnIRIS) {
      return networkRepository.findByIrisCode(address.irisCode);
    }
    return networkRepository.findByCoords({
      lat: address.lat,
      lon: address.lon,
    });
  }
}
