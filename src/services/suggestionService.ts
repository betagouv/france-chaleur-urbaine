import { HttpClient } from '@components/lib';
import { SuggestionResponse } from 'src/types';
import { ServiceError } from './errors';

export class SuggestionService {
  httpClient: HttpClient;
  constructor(http: HttpClient) {
    this.httpClient = http;
  }
  async fetchSuggestions(
    searchTerm: string,
    params?: { limit: string; autocomplete: string }
  ): Promise<SuggestionResponse> {
    try {
      const baseURL = process.env.NEXT_PUBLIC_BAN_API_BASE_URL;

      const queryString = new URLSearchParams({
        q: searchTerm,
        ...params,
      }).toString();

      return await this.httpClient.get<SuggestionResponse>(
        `${baseURL}?${queryString}`
      );
    } catch (e) {
      throw new ServiceError(e);
    }
  }
}
