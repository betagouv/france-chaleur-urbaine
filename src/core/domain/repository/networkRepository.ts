import { Coords } from '@core/domain/entity/address';
import { Network } from '@core/domain/entity/network';

export interface NetworkRepository {
  findByCoords(coords: Coords): Promise<Network>;
  findByIrisCode(irisCode: string): Promise<Network>;
}
