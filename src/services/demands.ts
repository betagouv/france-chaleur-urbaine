import React from 'react';

import { HttpClient } from 'src/services/http';
import { Demand } from 'src/types/Summary/Demand';

import { ServiceError } from './errors';

export type RowsParams = {
  name: string;
  label: React.ReactNode;
  render?: (d: Demand) => any;
};

export class DemandsService {
  httpClient: HttpClient;
  constructor(http: HttpClient) {
    this.httpClient = http;
  }
  async fetch(): Promise<Demand[]> {
    try {
      return await this.httpClient.get<Demand[]>(`/api/demands`);
    } catch (e) {
      throw new ServiceError(e);
    }
  }

  async update(demandId: string, demandUpdate: Record<string, any>): Promise<Demand> {
    try {
      return await this.httpClient.put(`/api/demands/${demandId}`, demandUpdate).then((response) => response.data);
    } catch (e) {
      throw new ServiceError(e);
    }
  }

  async export(): Promise<any> {
    try {
      return await this.httpClient.post(`/api/demands`).then(async (response) => {
        const a = document.createElement('a');
        a.download = 'demands_fcu.xlsx';

        const byteCharacters = window.atob(response.data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        a.href = URL.createObjectURL(new Blob([byteArray]));
        a.addEventListener('click', () => {
          setTimeout(() => URL.revokeObjectURL(a.href), 30 * 1000);
        });
        a.click();
      });
    } catch (e) {
      throw new ServiceError(e);
    }
  }
}
