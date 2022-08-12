import { AxiosResponse } from 'axios';

export interface HttpClient {
  get<T>(url: string): Promise<T>;
  post(url: string): Promise<AxiosResponse>;
}
