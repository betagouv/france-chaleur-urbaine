import { HttpClient } from 'src/services/http';
import { EligibilityDemand } from 'src/types/EligibilityDemand';
import { UserResponse } from 'src/types/UserResponse';

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
