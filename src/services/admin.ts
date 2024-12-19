import { type AdminManageUserItem } from '@/pages/api/admin/users';
import { type HttpClient } from '@/services/http';
import { type EligibilityDemand } from '@/types/EligibilityDemand';

export class AdminService {
  httpClient: HttpClient;
  constructor(http: HttpClient) {
    this.httpClient = http;
  }

  async getUsers() {
    return this.httpClient.get<AdminManageUserItem[]>('/api/admin/users');
  }

  async getEligibilityDemand(): Promise<EligibilityDemand[]> {
    return this.httpClient.get<EligibilityDemand[]>('/api/eligibilityDemands');
  }
}
