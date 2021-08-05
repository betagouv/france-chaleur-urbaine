import { Address } from '@core/domain/entity';
import { Network } from '@core/domain/entity/network';
import { RepositoryError } from '@core/domain/errors';
import { HttpClient } from '@core/domain/lib';
import { NetworkRepository } from '@core/domain/repository/networkRepository';
import { NetworkResponse } from '@core/infrastructure/mapper/network.dto';
import { NetworkMapper } from '@core/infrastructure/mapper/network.mapper';

export class NetworkIdfRepository implements NetworkRepository {
  constructor(public client: HttpClient) {}
  async findNearestOf(address: Address): Promise<Network> {
    try {
      const NetworkRaw = await this.client.get<NetworkResponse>(
        `${process.env.NEXT_PUBLIC_HEAT_NETWORK_API_BASE_URL}?lat=${address.lat}&lon=${address.lon}`
      );
      return NetworkMapper.toDomain(NetworkRaw);
    } catch (e) {
      throw new RepositoryError(e);
    }
  }
}
