import { HttpClient } from 'src/services/http';
import { UserResponse } from 'src/types/UserResponse';

export class AdminService {
  httpClient: HttpClient;
  constructor(http: HttpClient) {
    this.httpClient = http;
  }

  async getUsers(): Promise<UserResponse[]> {
    return this.httpClient.get<UserResponse[]>('/api/users');
  }
}
