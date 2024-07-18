import axios, { AxiosResponse } from 'axios';

import { HttpClient } from './HttpClient';

class AxiosHttpClient implements HttpClient {
  async get<T>(url: string): Promise<T> {
    return axios.get(url).then((responseRaw) => {
      return responseRaw.data as T;
    });
  }
  async post(url: string, body: any): Promise<AxiosResponse> {
    return axios.post(url, body);
  }

  async put(url: string, body: any): Promise<AxiosResponse> {
    return axios.put(url, body);
  }
}

export const axiosHttpClient = new AxiosHttpClient();
