import { Coords } from '@core/domain/entity/address';
import { Network } from 'src/types/HeatNetworksResponse';

export interface NetworkRepository {
  findByCoords(coords: Coords): Promise<Network>;
  findByIrisCode(irisCode: string): Promise<Network>;
}
