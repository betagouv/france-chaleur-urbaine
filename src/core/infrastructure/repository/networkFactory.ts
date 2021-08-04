import { HttpClient } from '@core/domain/lib';
import { NetworkRepository } from '@core/domain/repository/networkRepository';
import { NetworkIdfExcludedRepository } from '@core/infrastructure/repository/networkIdfExcludedRepository';
import { NetworkIdfRepository } from '@core/infrastructure/repository/networkIdfRepository';

export class NetworkFactory {
  static create(isIDFAddress: boolean, client: HttpClient): NetworkRepository {
    if (isIDFAddress) {
      return new NetworkIdfRepository(client);
    }
    return new NetworkIdfExcludedRepository();
  }
}
