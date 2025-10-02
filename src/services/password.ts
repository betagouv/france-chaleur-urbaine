import type { AxiosResponse } from 'axios';

import type { HttpClient } from '@/services/http';

export class PasswordService {
  httpClient: HttpClient;
  constructor(http: HttpClient) {
    this.httpClient = http;
  }
  async resetPassword(email: string): Promise<AxiosResponse<void>> {
    return this.httpClient.post(`/api/password/reset`, { email });
  }
  async changePassword(token: string, password: string): Promise<AxiosResponse<void>> {
    return this.httpClient.post(`/api/password/change`, { password, token });
  }
}
