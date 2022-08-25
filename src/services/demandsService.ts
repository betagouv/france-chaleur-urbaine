import { HttpClient } from 'src/services/http';
import { Demand } from 'src/types/Summary/Demand';
import { ServiceError } from './errors';

export class DemandsService {
  httpClient: HttpClient;
  constructor(http: HttpClient) {
    this.httpClient = http;
  }
  async fetchDemands(): Promise<Demand[]> {
    try {
      return await this.httpClient.get<Demand[]>(`/api/demands`);
    } catch (e) {
      throw new ServiceError(e);
    }
  }
}
