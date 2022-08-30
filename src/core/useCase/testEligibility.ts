import { Coords } from '@core/domain/entity/address';
import { AddressRepository } from '@core/domain/repository/addressRepository';
import { NetworkRepository } from '@core/domain/repository/networkRepository';
import { NetworkService } from '@core/domain/services/networkService';
import inZDP from '@core/infrastructure/repository/zdp';
import { AddressEligibility } from 'src/types/HeatNetworksResponse';

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

    return {
      address,
      network: nearestNetwork,
      isEligible,
      inZDP: await inZDP(coordinates.lat, coordinates.lon),
    };
  }
}
