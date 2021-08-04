import { HttpClient } from '@core/domain/lib';

class FetchHttpClient implements HttpClient {
  async get<T>(url: string): Promise<T> {
    const config = {
      method: 'GET',
    };
    return fetch(url, config)
      .then(async (responseRaw) => {
        if (!responseRaw.ok) {
          throw new Error(await responseRaw.json());
        }
        return (await responseRaw.json()) as T;
      })
      .catch((err) => {
        throw new Error(err);
      });
  }
}
export const fetchHttpClient = new FetchHttpClient();
