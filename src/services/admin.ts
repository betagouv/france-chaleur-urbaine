import { HttpClient } from '@/services/http';
import { EligibilityDemand } from '@/types/EligibilityDemand';
import { UserResponse } from '@/types/UserResponse';

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
}
