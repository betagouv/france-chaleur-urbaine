import { Coords } from '@core/domain/entity/address';
import { AddressEligibility } from '@core/domain/entity/AddressEligibility';
import { HttpClient } from '@core/domain/lib';
import { AddressRepository } from '@core/domain/repository/addressRepository';
import { NetworkFactory } from '@core/infrastructure/repository/networkFactory';

export class TestEligibility {
  constructor(
    public addressRepository: AddressRepository,
    public client: HttpClient
  ) {}
  async check(coords: Coords): Promise<AddressEligibility> {
    const address = await this.addressRepository.findByCoords(coords);
    const nearestNetwork = await NetworkFactory.create(
      address.isIDF,
      this.client
    ).findNearestOf(address);
    const isEligible = address.isEligibleWith(nearestNetwork);
    return { address, network: nearestNetwork, isEligible };
  }
}
