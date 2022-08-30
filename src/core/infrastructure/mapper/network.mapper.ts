import { NetworkResponse } from '@core/infrastructure/mapper/network.dto';
import { Network } from 'src/types/HeatNetworksResponse';

export class NetworkMapper {
  static transform(value: number | undefined): number | null {
    return value ?? null;
  }

  static toDomain(networkRaw: NetworkResponse): Network {
    return networkRaw
      ? {
          lat: this.transform(networkRaw.latPointReseau),
          lon: this.transform(networkRaw.lonPointReseau),
          filiere: networkRaw.filiere || null,
          distance: this.transform(networkRaw.distPointReseau),
          irisCode: networkRaw.code?.toString() || null,
        }
      : this.createNullNetwork();
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
