import { Address } from '@core/domain/entity';
import { Network } from '@core/domain/entity/network';

export interface NetworkRepository {
  findNearestOf(address: Address): Promise<Network>;
}
