import { Address } from '@core/domain/entity';
import { Network } from '@core/domain/entity/network';
import { NetworkRepository } from '@core/domain/repository/networkRepository';

export class NetworkService {
  static findNearestOf(
    address: Address,
    networkRepository: NetworkRepository
  ): Promise<Network> {
    if (address.isIDF) {
      return networkRepository.findByCoords({
        lat: address.lat,
        lon: address.lon,
      });
    }
    return networkRepository.findByIrisCode(address.irisCode);
  }
}
