import { Coords } from '@core/domain/entity/address';
import { AddressEligibility } from '@core/domain/entity/AddressEligibility';
import { AddressRepository } from '@core/domain/repository/addressRepository';
import { NetworkRepository } from '@core/domain/repository/networkRepository';
import { NetworkService } from '@core/domain/services/networkService';

export class TestEligibility {
  constructor(
    public addressRepository: AddressRepository,
    public networkRepository: NetworkRepository
  ) {}
  async check(coordinates: Coords): Promise<AddressEligibility> {
    const address = await this.addressRepository.findByCoords(coordinates);
    const nearestNetwork = await NetworkService.findNearestOf(
      address,
      this.networkRepository
    );
    const isEligible = address.isEligibleWith(nearestNetwork);
    return { address, network: nearestNetwork, isEligible };
  }
}
