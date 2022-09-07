import { HttpClient } from 'src/services/http';
import { Demand } from 'src/types/Summary/Demand';
import { ServiceError } from './errors';

export type RowsParams = {
  name: string;
  label: string;
  render?: (d: Demand) => any;
  editable?: 'checkbox' | 'radio' | 'textarea' | 'text';
};

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

  async updateDemand(
    demandId: string,
    demandUpdate: Record<string, any>
  ): Promise<Demand> {
    try {
      return await this.httpClient
        .put(`/api/demands/${demandId}`, demandUpdate)
        .then((response) => response.data);
    } catch (e) {
      throw new ServiceError(e);
    }
  }
}
