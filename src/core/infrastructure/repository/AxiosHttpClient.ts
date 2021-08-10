import { HttpClient } from '@core/domain/lib';
import axios from 'axios';

class AxiosHttpClient implements HttpClient {
  async get<T>(url: string): Promise<T> {
    return axios
      .get(url)
      .then((responseRaw) => {
        return responseRaw.data as T;
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.log(err);
        throw new Error(err);
      });
  }
}
export const axiosHttpClient = new AxiosHttpClient();
