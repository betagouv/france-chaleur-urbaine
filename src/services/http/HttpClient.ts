import { AxiosResponse } from 'axios';

export interface HttpClient {
  get<T>(url: string): Promise<T>;
  post(url: string, body?: any): Promise<AxiosResponse>;
  put(url: string, body?: any): Promise<AxiosResponse>;
}
