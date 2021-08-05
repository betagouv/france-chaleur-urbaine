import { HttpClient } from './HttpClient';

class FetchHttpClient implements HttpClient {
  async get<T>(url: string): Promise<T> {
    const config = {
      method: 'GET',
    };
    return fetch(url, config)
      .then((responseRaw) => {
        if (!responseRaw.ok) {
          throw new Error(responseRaw.statusText);
        }
        return responseRaw.json() as Promise<T>;
      })
      .catch((err) => {
        throw new Error(err);
      });
  }
}
export const fetchHttpClient = new FetchHttpClient();
