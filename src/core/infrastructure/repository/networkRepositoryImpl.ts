import { Coords } from '@core/domain/entity/address';
import { Network } from '@core/domain/entity/network';
import { RepositoryError } from '@core/domain/errors';
import { NetworkRepository } from '@core/domain/repository/networkRepository';
import { NetworkIrisResponse } from '@core/infrastructure/mapper/network.dto';
import { NetworkMapper } from '@core/infrastructure/mapper/network.mapper';
import networkByIris from '@core/infrastructure/repository/network_by_iris.json';
import computeDistance from './distance';

export class NetworkRepositoryImpl implements NetworkRepository {
  async findByCoords(coords: Coords): Promise<Network> {
    try {
      const networkDistance = await computeDistance(coords.lat, coords.lon);
      return {
        lat: null,
        lon: null,
        filiere: null,
        distance:
          networkDistance === null || networkDistance === undefined
            ? null
            : Math.floor(networkDistance),
        irisCode: null,
      };
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
