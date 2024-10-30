import { AxiosRequestConfig, AxiosResponse } from 'axios';

export interface HttpClient {
  get<T>(url: string): Promise<T>;
  post(url: string, body?: any, config?: AxiosRequestConfig): Promise<AxiosResponse>;
  put(url: string, body?: any): Promise<AxiosResponse>;
}
