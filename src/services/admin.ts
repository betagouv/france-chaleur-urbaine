import { type HttpClient } from '@/services/http';
import { type EligibilityDemand } from '@/types/EligibilityDemand';

export class AdminService {
  httpClient: HttpClient;
  constructor(http: HttpClient) {
    this.httpClient = http;
  }

  async getEligibilityDemand(): Promise<EligibilityDemand[]> {
    return this.httpClient.get<EligibilityDemand[]>('/api/eligibilityDemands');
  }
}
