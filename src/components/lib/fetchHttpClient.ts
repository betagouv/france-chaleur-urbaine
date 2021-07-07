import { HttpClient } from './HttpClient';

class FetchHttpClient implements HttpClient {
  async get<T>(url: string): Promise<T> {
    const config = {
      method: 'GET',
    };
    try {
      const responseRaw = await fetch(url, config);
      return (await responseRaw.json()) as T;
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
export const fetchHttpClient = new FetchHttpClient();
