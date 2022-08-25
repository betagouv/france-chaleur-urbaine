import axios, { AxiosResponse } from 'axios';
import { HttpClient } from './HttpClient';

class AxiosHttpClient implements HttpClient {
  async get<T>(url: string): Promise<T> {
    return axios.get(url).then((responseRaw) => {
      return responseRaw.data as T;
    });
  }
  async post(url: string): Promise<AxiosResponse> {
    return axios.post(url).then((responseRaw) => {
      return responseRaw;
    });
  }
}

export const axiosHttpClient = new AxiosHttpClient();
