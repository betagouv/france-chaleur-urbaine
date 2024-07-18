import { HttpClient } from 'src/services/http';
import { EligibilityDemand } from 'src/types/EligibilityDemand';
import { UserResponse } from 'src/types/UserResponse';

import { ServiceError } from './errors';

export class AdminService {
  httpClient: HttpClient;
  constructor(http: HttpClient) {
    this.httpClient = http;
  }

  async getUsers(): Promise<UserResponse[]> {
    return this.httpClient.get<UserResponse[]>('/api/users');
  }

  async getEligibilityDemand(): Promise<EligibilityDemand[]> {
    return this.httpClient.get<EligibilityDemand[]>('/api/eligibilityDemands');
  }

  async exportObsoleteUsers(): Promise<any> {
    try {
      return await this.httpClient.post(`/api/admin/exportObsoleteUsers`).then(async (response) => {
        const a = document.createElement('a');
        a.download = 'comptes_obsoletes.xlsx';

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
