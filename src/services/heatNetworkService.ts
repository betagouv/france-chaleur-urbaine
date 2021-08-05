import { HttpClient } from '@components/lib';
import { Coords, HeatNetworksResponse } from 'src/types';
import { ServiceError } from './errors';

export class HeatNetworkService {
  httpClient: HttpClient;
  constructor(http: HttpClient) {
    this.httpClient = http;
  }
  async findByCoords({ lon, lat }: Coords): Promise<HeatNetworksResponse> {
    try {
      return await this.httpClient.get<HeatNetworksResponse>(
        `/api/eligibility?lat=${lat}&lon=${lon}`
      );
    } catch (e) {
      throw new ServiceError(e);
    }
  }
}
