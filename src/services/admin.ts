import { type HttpClient } from '@/services/http';
import { type EligibilityDemand } from '@/types/EligibilityDemand';
import { type UserResponse } from '@/types/UserResponse';

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
