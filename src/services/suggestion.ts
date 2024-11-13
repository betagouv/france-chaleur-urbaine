import { HttpClient } from 'src/services/http';
import { SuggestionResponse } from 'src/types/Suggestions';

import { ServiceError } from './errors';

export class SuggestionService {
  httpClient: HttpClient;
  constructor(http: HttpClient) {
    this.httpClient = http;
  }
  async fetchSuggestions(searchTerm: string, params?: { limit: string; type?: 'municipality' }): Promise<SuggestionResponse> {
    try {
      const baseURL = process.env.NEXT_PUBLIC_BAN_API_BASE_URL;

      const queryString = new URLSearchParams({
        q: searchTerm,
        ...params,
      }).toString();

      return await this.httpClient.get<SuggestionResponse>(`${baseURL}?${queryString}`);
    } catch (e) {
      throw new ServiceError(e);
    }
  }
}
