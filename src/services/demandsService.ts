import { HttpClient } from 'src/services/http';
import { Demand } from 'src/types/Summary/Demand';
import { ServiceError } from './errors';

export const demandRowsParams = [
  {
    name: 'Nom',
    label: 'Nom',
    render: (demand: Demand) =>
      `${demand.Prénom ? `${demand.Prénom} ` : ''}${demand.Nom}`,
  },
  { name: 'Structure', label: 'Structure' },
  { name: 'Établissement', label: 'Établissement' },
  { name: 'Mail', label: 'Email' },
  { name: 'Adresse', label: 'Adresse' },
  { name: 'Distance au réseau', label: 'Distance au réseau' },
  { name: 'Type de chauffage', label: 'Type de chauffage' },
  { name: 'Mode de chauffage', label: 'Mode de chauffage' },
];

export class DemandsService {
  httpClient: HttpClient;
  constructor(http: HttpClient) {
    this.httpClient = http;
  }
  async fetchDemands(): Promise<Demand[]> {
    try {
      return await this.httpClient.get<Demand[]>(`/api/demands`);
    } catch (e) {
      throw new ServiceError(e);
    }
  }
  async fetchDemand(demandId: string): Promise<Demand> {
    try {
      return await this.httpClient.get<Demand>(`/api/demands/${demandId}`);
    } catch (e) {
      throw new ServiceError(e);
    }
  }
}
