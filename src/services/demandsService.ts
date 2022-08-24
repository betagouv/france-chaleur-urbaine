import { HttpClient } from 'src/services/http';
import { DemandSummary } from 'src/types/Summary/Demand';
import { ServiceError } from './errors';

export class DemandsService {
  httpClient: HttpClient;
  constructor(http: HttpClient) {
    this.httpClient = http;
  }
  async fetchDemands(): Promise<DemandSummary[]> {
    try {
      return await this.httpClient.get<DemandSummary[]>(`/api/demands`);
    } catch (e) {
      throw new ServiceError(e);
    }
  }
}
