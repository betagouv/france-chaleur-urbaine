import { Address } from '@core/domain/entity';
import { Network } from '@core/domain/entity/network';
import { NetworkRepository } from '@core/domain/repository/networkRepository';
import { NetworkIrisResponse } from '@core/infrastructure/mapper/network.dto';
import { NetworkMapper } from '@core/infrastructure/mapper/network.mapper';
import networkByIris from './network_by_iris.json';

export class NetworkIdfExcludedRepository implements NetworkRepository {
  async findNearestOf(address: Address): Promise<Network> {
    const foundNetwork = networkByIris.find((network) => {
      return Number(network.code) === Number(address.irisCode);
    });
    if (IsNetworkIrisResponse(foundNetwork)) {
      return NetworkMapper.toDomain(foundNetwork);
    }
    return NetworkMapper.createNullNetwork();
  }
}

export const IsNetworkIrisResponse = (
  networkResponse: NetworkIrisResponse | undefined
): networkResponse is NetworkIrisResponse => {
  return (networkResponse as NetworkIrisResponse)?.code !== undefined;
};
