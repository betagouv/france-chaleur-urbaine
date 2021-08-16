import { Coords } from '@core/domain/entity/address';
import { Network } from '@core/domain/entity/network';
import { RepositoryError } from '@core/domain/errors';
import { HttpClient } from '@core/domain/lib';
import { NetworkRepository } from '@core/domain/repository/networkRepository';
import {
  NetworkIrisResponse,
  NetworkResponse,
} from '@core/infrastructure/mapper/network.dto';
import { NetworkMapper } from '@core/infrastructure/mapper/network.mapper';
import networkByIris from '@core/infrastructure/repository/network_by_iris.json';

export class NetworkRepositoryImpl implements NetworkRepository {
  constructor(public client: HttpClient) {}
  async findByCoords(coords: Coords): Promise<Network> {
    try {
      const networkRaw = await this.client.get<NetworkResponse>(
        `${process.env.NEXT_PUBLIC_HEAT_NETWORK_API_BASE_URL}?lat=${coords.lat}&lon=${coords.lon}`
      );
      if (!networkRaw?.latPointReseau || !networkRaw?.lonPointReseau) {
        return NetworkMapper.createNullNetwork();
      }
      return NetworkMapper.toDomain(networkRaw);
    } catch (e) {
      throw new RepositoryError(e);
    }
  }
  async findByIrisCode(addressIrisCode: string): Promise<Network> {
    const foundNetwork = networkByIris.find((network) => {
      return Number(network.code) === Number(addressIrisCode);
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
