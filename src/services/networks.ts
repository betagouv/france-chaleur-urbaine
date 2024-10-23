import React from 'react';

import { HttpClient } from 'src/services/http';
import { NetworkToCompare } from 'src/types/Summary/Network';

import { ServiceError } from './errors';

export type RowsParams = {
  name: string;
  label: React.ReactNode;
  render?: (d: NetworkToCompare) => any;
};

export class NetworksService {
  httpClient: HttpClient;
  constructor(http: HttpClient) {
    this.httpClient = http;
  }
  async fetch(): Promise<NetworkToCompare[]> {
    try {
      return await this.httpClient.get<NetworkToCompare[]>(`/api/networks/all`);
    } catch (e) {
      throw new ServiceError(e);
    }
  }
}
