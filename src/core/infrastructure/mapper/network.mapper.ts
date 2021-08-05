import { Network } from '@core/domain/entity/network';
import { NetworkResponse } from '@core/infrastructure/mapper/network.dto';

export class NetworkMapper {
  static toDomain(networkRaw: NetworkResponse): Network {
    return {
      lat: networkRaw?.latPointReseau || null,
      lon: networkRaw?.lonPointReseau || null,
      filiere: networkRaw?.filiere || null,
      distance: networkRaw?.distPointReseau || null,
      irisCode: networkRaw?.code || null,
    };
  }
  static createNullNetwork(): Network {
    return {
      lat: null,
      lon: null,
      filiere: null,
      distance: null,
      irisCode: null,
    };
  }
}
